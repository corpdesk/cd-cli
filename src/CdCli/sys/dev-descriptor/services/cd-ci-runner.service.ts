import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import { CdAiModel } from "../../../app/mod-craft/workshop/cd-api/model/cd-ai-module.model.js";
import { CD_FX_FAIL, CdFxReturn, ICdRequest } from "../../base/IBase.js";
import CdLog from "../../cd-comm/controllers/cd-logger.controller.js";
import { CdControllerDescriptor } from "../models/cd-controller-descriptor.model.js";
import { CdModuleDescriptor } from "../models/cd-module-descriptor.model.js";
import {
  CiCdDescriptor,
  CICdPipeline,
  CICdTask,
  ExecutionEnvironmentType,
  WFNext,
  WFNextRef,
} from "../models/cicd-descriptor.model.js";
import { CdAiWorkFlow } from "../../../app/mod-craft/workshop/cd-api/workflow/cd-ai.create.workflow.js";
import { toDashedFileName } from "../../utilities/request-helper.js";

/** Runner responsible for executing CICdTask logic */
export class CICdRunnerService {
  currentPipelineName = "";
  currentStageName = "";
  async loadModuleDescriptorAndWorkflow(
    moduleName: string,
    moduleType: string,
    token: string
  ): Promise<{
    moduleDescriptor: CdModuleDescriptor;
    workflowModel: CiCdDescriptor;
  }> {
    CdLog.debug(
      "Starting CICdRunnerService::loadModuleDescriptorAndWorkflow()"
    );

    const dashedName = moduleName.toLowerCase();
    const pascalName = dashedName
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");

    // Convert __dirname equivalent in ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Build real absolute paths
    // Go up to /dist
    const projectRoot = path.resolve(__dirname, "../../../..");
    const modelFile = path.resolve(
      projectRoot,
      `CdCli/app/mod-craft/workshop/${moduleType}/model/${dashedName}-module.model.js`
    );
    const workflowFile = path.resolve(
      projectRoot,
      `CdCli/app/mod-craft/workshop/${moduleType}/workflow/${dashedName}.create.workflow.js`
    );

    CdLog.debug(`Model Path: ${modelFile}`);
    CdLog.debug(`Workflow Path: ${workflowFile}`);

    // Import dynamically using pathToFileURL
    const modelModule = await import(pathToFileURL(modelFile).href);
    const ModelClass = modelModule[`${pascalName}Model`];
    const moduleInstance = new ModelClass();
    const moduleDescriptor: CdModuleDescriptor =
      moduleInstance.getModuleModel();

    const workflowModule = await import(pathToFileURL(workflowFile).href);
    const WorkflowClass = workflowModule[`${pascalName}WorkFlow`];
    const workflowInstance = new WorkflowClass();
    const workflowModel: CiCdDescriptor = workflowInstance.createWorkFlow(
      moduleDescriptor,
      moduleType,
      token
    );

    return { moduleDescriptor, workflowModel };
  }

  async run(
    moduleDescriptor: CdModuleDescriptor,
    descriptor: CiCdDescriptor
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::run()");

    const pipeline = descriptor?.cICdPipeline;
    this.currentPipelineName = pipeline?.name ?? "";

    if (!pipeline?.stages?.length) {
      return { state: false, message: "No pipeline stages defined." };
    }

    // 1. Flatten and index all tasks
    const taskMap = new Map<string, CICdTask>();
    for (const stage of pipeline.stages) {
      for (const task of stage.tasks) {
        taskMap.set(task.name, task);
      }
    }

    // 2. Start execution from the first task in first stage
    let currentTask = pipeline.stages[0].tasks[0];
    const visited = new Set<string>();

    while (currentTask) {
      if (visited.has(currentTask.name)) {
        return {
          state: false,
          message: `Loop detected at task: ${currentTask.name}`,
        };
      }
      visited.add(currentTask.name);

      currentTask.status = "running";
      const result = await this.executeTaskWithPolicies(
        currentTask,
        moduleDescriptor
      );

      currentTask.status = result.state ? "completed" : "failed";

      // 3. Determine next task based on outcome
      const nextTaskRef = this.resolveNextTask(currentTask, result.state);
      if (!nextTaskRef) break;

      const nextTask = taskMap.get(nextTaskRef.taskName);
      if (!nextTask) {
        return {
          state: false,
          message: `Next task "${nextTaskRef.taskName}" not found.`,
        };
      }

      currentTask = nextTask;
    }

    return { state: true, message: "Pipeline executed successfully." };
  }

  private async executeTaskWithPolicies(
    task: CICdTask,
    moduleDescriptor: CdModuleDescriptor
  ): Promise<CdFxReturn<null>> {
    let attempts = 0;
    const maxAttempts = task.retryCount ?? 1;

    while (attempts < maxAttempts) {
      try {
        const timeout = task.timeout ?? 60000; // default 60s
        const result = await Promise.race([
          this.executeTask(task, moduleDescriptor),
          new Promise<CdFxReturn<null>>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), timeout)
          ),
        ]);

        if (result.state) return result;
        attempts++;
        if (attempts < maxAttempts && task.retryDelay) {
          await this.sleep(task.retryDelay);
        }
      } catch (e) {
        CdLog.debug(
          `Task ${task.name} failed with error: ${(e as Error).message}`
        );
        attempts++;
      }
    }

    return {
      state: false,
      message: `Task ${task.name} failed after ${maxAttempts} attempts.`,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // private resolveNextTask(task: CICdTask, success: boolean): string | null {
  //   const resultKey = success ? "success" : "failure";

  //   const nextFromOnResult = task.onResult?.find(
  //     (rule) => rule.condition === resultKey || rule.condition === "always"
  //   )?.next;

  //   return nextFromOnResult ?? null;
  // }
  private resolveNextTask(task: CICdTask, success: boolean): WFNext | null {
    const resultKey = success ? "success" : "failure";

    if (!task.onResult || !Array.isArray(task.onResult)) return null;

    // 1. Try exact match
    for (const rule of task.onResult) {
      if (rule.condition === resultKey) {
        return this.normalizeWFNext(rule.next, {
          currentPipeline: this.currentPipelineName,
          currentStage: this.currentStageName,
        });
      }
    }

    // 2. Fallback to 'always'
    const alwaysRule = task.onResult.find((r) => r.condition === "always");
    return alwaysRule
      ? this.normalizeWFNext(alwaysRule.next, {
          currentPipeline: this.currentPipelineName,
          currentStage: this.currentStageName,
        })
      : null;
  }

  normalizeWFNext(
    next: WFNextRef,
    context: { currentPipeline: string; currentStage: string }
  ): WFNext {
    if (typeof next === "string") {
      return {
        pipelineName: context.currentPipeline,
        stageName: context.currentStage,
        taskName: next,
      };
    }
    return {
      pipelineName: next.pipelineName ?? context.currentPipeline,
      stageName: next.stageName ?? context.currentStage,
      taskName: next.taskName,
    };
  }

  /**
   * Executes a single CICdTask based on its type.
   * @param task - The task to execute.
   * @param descriptor - The module descriptor for context.
   * @returns A promise resolving to the result of the task execution.
   */
  async executeTask(
    task: CICdTask,
    descriptor: CdModuleDescriptor
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::executeTask()");
    CdLog.debug(
      `CICdRunnerService::executeTask()/task:${JSON.stringify(task)}`
    );
    CdLog.debug(`CICdRunnerService::executeTask()/task.type:${task.type}`);
    CdLog.debug(
      `CICdRunnerService::executeTask()/descriptor:${JSON.stringify(
        descriptor
      )}`
    );
    try {
      switch (task.type) {
        case "script-inline":
          CdLog.debug("Running case: script-inline");
          return await this.runScript(task.executor, task.script);
        case "script-file":
          CdLog.debug("Running case: script-file");
          return await this.runScriptFromFile(task.executor, task.scriptFile);
        case "method":
          CdLog.debug("Running case: method");
          if (!task.cdRequest) {
            return {
              state: false,
              message: "cdRequest is undefined for method task.",
            };
          }
          return await this.callMethodFromCdRequest(task.cdRequest);
        case "cdRequest":
          CdLog.debug("Running case: cdRequest");
          return await this.invokeCdRequest(task.cdRequest);
        default:
          return { state: false, message: `Unknown task type: ${task.type}` };
      }
    } catch (err) {
      return {
        state: false,
        message: `Exception in task: ${task.name}. Error: ${
          (err as Error).message
        }`,
      };
    }
  }

  private async runScript(
    executor: ExecutionEnvironmentType,
    script?: string
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::runScript()");
    if (!script) return { state: false, message: "No inline script provided." };
    // Placeholder: implement real script runner
    console.log(`[${executor}] Running script: ${script}`);
    return { state: true, message: "Script executed." };
  }

  private async runScriptFromFile(
    executor: ExecutionEnvironmentType,
    scriptFile?: string
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::runScriptFromFile()");
    if (!scriptFile)
      return { state: false, message: "No script file path provided." };
    // Placeholder: simulate reading and running the script
    console.log(`[${executor}] Executing script file: ${scriptFile}`);
    return { state: true, message: "Script file executed." };
  }

  private async callMethod(
    className?: string,
    methodName?: string,
    input?: any
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::callMethod()");
    if (!className || !methodName)
      return { state: false, message: "Missing class or method name." };
    // Placeholder: simulate reflection call to service
    console.log(
      `[cd-cli] Calling ${className}.${methodName} with input:`,
      input
    );
    return { state: true, message: "Method called successfully." };
  }

  async callMethodFromCdRequest<T = any>(
    cdRequest: ICdRequest
  ): Promise<CdFxReturn<T>> {
    CdLog.debug("Starting CICdRunnerService::callMethodFromCdRequest()");

    let { ctx, m, c, a, args, dat } = cdRequest;

    if (!ctx || !m || !c || !a) {
      return {
        state: false,
        message: "Incomplete cdRequest — requires ctx, m, c, and a",
      };
    }

    try {
      const ctlDashedName = toDashedFileName(c, "controller");
      const controllerPath = `../../../${ctx}/${m}/controllers/${ctlDashedName}`;

      // Dynamic ESM import (MUST include .js in helper-generated name)
      const controllerModule = await import(controllerPath);
      c = `${c}Controller`;
      if (!controllerModule || !controllerModule[c]) {
        return {
          state: false,
          message: `Controller class '${c}' not found in '${controllerPath}'`,
        };
      }

      CdLog.debug(
        `CICdRunnerService::callMethodFromCdRequest()/{ctx:${ctx},m:${m},c:${c},a:${a},}`
      );

      const ControllerClass = controllerModule[c];
      const controllerInstance = new ControllerClass();

      if (typeof controllerInstance[a] !== "function") {
        return {
          state: false,
          message: `Method '${a}' not found on controller '${c}'`,
        };
      }

      const argValues = args ? Object.values(args) : [];
      const result: CdFxReturn<T> = await controllerInstance[a](
        ...argValues,
        dat
      );

      return result;
    } catch (e: any) {
      CdLog.error(
        `CICdRunnerService::callMethodFromCdRequest error: ${
          (e as Error).message
        }`
      );
      return {
        state: false,
        message: "Failed to invoke method from cdRequest",
        data: null,
      };
    }
  }

  private async invokeCdRequest(
    cdRequest?: ICdRequest
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::invokeCdRequest()");
    if (!cdRequest) {
      return { state: false, message: "cdRequest is undefined or null." };
    }

    const { ctx, m, c, a, args, dat } = cdRequest;

    try {
      // Resolve context directory
      const contextRoot = ctx === "Sys" ? "sys" : "app";
      const moduleName = `${m}Module`;
      const controllerName = `${c}Controller`;

      // Construct full path
      const modulePath = `../../${contextRoot}/${moduleName}/controllers/${controllerName}`;
      const ControllerClass = (await import(modulePath))[controllerName];

      if (!ControllerClass) {
        return {
          state: false,
          message: `Controller not found: ${controllerName}`,
        };
      }

      const controllerInstance = new ControllerClass();

      if (typeof controllerInstance[a] !== "function") {
        return { state: false, message: `Action method not found: ${a}` };
      }

      // Call the controller method with args and dat
      const result = await controllerInstance[a](
        ...(args ? Object.values(args) : []),
        dat
      );
      if (!result.state) {
        CdLog.error(`Task failed: ${result.message}`);
        return result;
      } else {
        return CD_FX_FAIL;
      }
    } catch (err) {
      return {
        state: false,
        message: `Error executing cdRequest: ${(err as Error).message}`,
      };
    }
  }
}
