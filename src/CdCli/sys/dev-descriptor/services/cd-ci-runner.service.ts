import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import { CdAiModel } from "../../../app/mod-craft/workshop/cd-api/model/cd-ai-module.model.js";
import {
  CD_FX_FAIL,
  CdFxReturn,
  CdFxStateLevel,
  ICdRequest,
} from "../../base/IBase.js";
import CdLog from "../../cd-comm/controllers/cd-logger.controller.js";
import { CdControllerDescriptor } from "../models/cd-controller-descriptor.model.js";
import { CdModuleDescriptor } from "../models/cd-module-descriptor.model.js";
import {
  CiCdDescriptor,
  CICdPipeline,
  CICdTask,
  // ExecutionEnvironmentType,
  // WFNext,
  // WFNextRef,
} from "../models/cicd-descriptor.model.js";
import { CdAiWorkFlow } from "../../../app/mod-craft/workshop/cd-api/workflow/cd-ai.create.workflow.js";
import { toDashedFileName } from "../../utilities/request-helper.js";
import { inspect } from "util";
import {
  ExecutionEnvironmentType,
  WFNext,
  WFNextRef,
} from "../../cd-scheduler/models/cd-scheduler.model.js";

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
    CdLog.debug("CICdRunnerService::run()/01");

    const pipeline = descriptor?.cICdPipeline;
    this.currentPipelineName = pipeline?.name ?? "";

    if (!pipeline?.stages?.length) {
      CdLog.debug("CICdRunnerService::run()/02");
      return { state: false, message: "No pipeline stages defined." };
    }

    // 1. Flatten and index all tasks with a unique key: stageName/taskName
    const taskMap = new Map<string, CICdTask>();
    for (const stage of pipeline.stages) {
      CdLog.debug("CICdRunnerService::run()/03");
      for (const task of stage.tasks) {
        CdLog.debug("CICdRunnerService::run()/04");
        const key = `${stage.name}/${task.name}`; // unique key
        taskMap.set(key, task);
      }
    }

    // 2. Start execution from the first task in the first stage
    let currentStage = pipeline.stages[0];
    let currentTask = currentStage.tasks[0];
    this.currentStageName = currentStage.name;

    const visited = new Set<string>();

    while (currentTask) {
      CdLog.debug("CICdRunnerService::run()/05");
      const taskKey = `${this.currentStageName}/${currentTask.name}`;
      if (visited.has(taskKey)) {
        CdLog.debug("CICdRunnerService::run()/06");
        return {
          state: false,
          message: `Loop detected at task: ${currentTask.name}`,
        };
      }
      CdLog.debug("CICdRunnerService::run()/07");
      visited.add(taskKey);

      currentTask.status = "running";
      const result = await this.executeTaskWithPolicies(
        currentTask,
        moduleDescriptor
      );
      CdLog.debug(
        "CICdRunnerService::run()/result:" + inspect(result, { depth: 2 })
      );
      CdLog.debug("CICdRunnerService::run()/08");
      currentTask.status = result.state ? "completed" : "failed";

      // 3. Determine next task
      const nextRef = this.resolveNextTask(
        currentTask,
        result.state as CdFxStateLevel
      );
      CdLog.debug(
        `CICdRunnerService::run()/nextRef:${inspect(nextRef, { depth: 2 })}`
      );
      if (!nextRef) break;

      CdLog.debug("CICdRunnerService::run()/09");
      // Normalize for lookup key
      const pipelineName = nextRef.pipelineName ?? this.currentPipelineName;
      const stageName = nextRef.stageName ?? this.currentStageName;
      const taskName = nextRef.taskName;

      // 🚨 Optional: support only current pipeline for now
      if (pipelineName !== this.currentPipelineName) {
        CdLog.debug("CICdRunnerService::run()/10");
        return {
          state: false,
          message: `Cross-pipeline transition not supported: ${pipelineName}`,
        };
      }

      const nextKey = `${stageName}/${taskName}`;
      const nextTask = taskMap.get(nextKey);

      if (!nextTask) {
        CdLog.debug("CICdRunnerService::run()/11");
        return {
          state: false,
          message: `Next task "${taskName}" in stage "${stageName}" not found.`,
        };
      }

      // Set new context
      this.currentStageName = stageName;
      currentTask = nextTask;
    }

    CdLog.debug("CICdRunnerService::run()/12");
    return { state: true, message: "Pipeline executed successfully." };
  }

  private async executeTaskWithPolicies(
    task: CICdTask,
    moduleDescriptor: CdModuleDescriptor
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::executeTaskWithPolicies()");
    CdLog.debug("CICdRunnerService::executeTaskWithPolicies()/01");
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

        CdLog.debug(
          `CICdRunnerService::executeTaskWithPolicies()/result:${inspect(
            result,
            { depth: 2 }
          )}`
        );
        CdLog.debug("CICdRunnerService::executeTaskWithPolicies()/02");

        if (result.state as CdFxStateLevel) return result;
        attempts++;
        if (attempts < maxAttempts && task.retryDelay) {
          CdLog.debug("CICdRunnerService::executeTaskWithPolicies()/03");
          await this.sleep(task.retryDelay);
        }
      } catch (e) {
        CdLog.debug("CICdRunnerService::executeTaskWithPolicies()/04");
        CdLog.debug(
          `CICdRunnerService::executeTaskWithPolicies()/Task ${
            task.name
          } failed with error: ${(e as Error).message}`
        );
        attempts++;
      }
    }
    CdLog.debug("CICdRunnerService::executeTaskWithPolicies()/05");
    return {
      state: false,
      message: `Task ${task.name} failed after ${maxAttempts} attempts.`,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  
  private resolveNextTask(
    task: CICdTask,
    success: CdFxStateLevel
  ): WFNext | null {
    const resultKey: CdFxStateLevel = success
      ? CdFxStateLevel.Success
      : CdFxStateLevel.Error;

    if (!task.onResult || !Array.isArray(task.onResult)) return null;

    // 1. Try exact match: check single or array match
    for (const rule of task.onResult) {
      const match = Array.isArray(rule.ifState)
        ? rule.ifState.includes(resultKey)
        : rule.ifState === resultKey;

      if (match) {
        return this.normalizeWFNext(rule.toTask, {
          currentPipeline: this.currentPipelineName,
          currentStage: this.currentStageName,
        });
      }
    }

    // 2. Fallback: no ifState means always
    const alwaysRule = task.onResult.find((r) => r.ifState === undefined);
    return alwaysRule
      ? this.normalizeWFNext(alwaysRule.toTask, {
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

  async callMethod(
    className?: string,
    methodName?: string,
    input?: any
  ): Promise<CdFxReturn<null>> {
    CdLog.debug("Starting CICdRunnerService::callMethod()");
    CdLog.debug(`CICdRunnerService::callMethod()/01`);
    if (!className || !methodName)
      CdLog.debug(`CICdRunnerService::callMethod()/02`);
    return { state: false, message: "Missing class or method name." };
    // // Placeholder: simulate reflection call to service
    // console.log(
    //   `[cd-cli] Calling ${className}.${methodName} with input:`,
    //   input
    // );
    // return { state: true, message: "Method called successfully." };
  }

  async callMethodFromCdRequest<T = any>(
    cdRequest: ICdRequest
  ): Promise<CdFxReturn<T>> {
    CdLog.debug("Starting CICdRunnerService::callMethodFromCdRequest()");
    CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/01`);
    let { ctx, m, c, a, args, dat } = cdRequest;

    if (!ctx || !m || !c || !a) {
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/02`);
      return {
        state: false,
        message: "Incomplete cdRequest — requires ctx, m, c, and a",
      };
    }

    try {
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/03`);
      const ctlDashedName = toDashedFileName(c, "controller");
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/04`);
      CdLog.debug(
        `CICdRunnerService::callMethodFromCdRequest()/ctlDashedName:${ctlDashedName}`
      );
      const controllerPath = `../../../${ctx}/${m}/controllers/${ctlDashedName}`;
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/05`);
      CdLog.debug(
        `CICdRunnerService::callMethodFromCdRequest()/controllerPath:${controllerPath}`
      );

      // Dynamic ESM import (MUST include .js in helper-generated name)
      const controllerModule = await import(controllerPath);
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/06`);
      CdLog.debug(
        `CICdRunnerService::callMethodFromCdRequest()/controllerModule:${inspect(
          controllerModule,
          { depth: 2 }
        )}`
      );
      c = `${c}Controller`;
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/c:${c}`);
      if (!controllerModule || !controllerModule[c]) {
        CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/07`);
        return {
          state: false,
          message: `Controller class '${c}' not found in '${controllerPath}'`,
        };
      }

      CdLog.debug(
        `CICdRunnerService::callMethodFromCdRequest()/{ctx:${ctx},m:${m},c:${c},a:${a},}`
      );

      const ControllerClass = controllerModule[c];
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/08`);
      const controllerInstance = new ControllerClass();
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/09`);
      if (typeof controllerInstance[a] !== "function") {
        CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/10`);
        return {
          state: false,
          message: `Method '${a}' not found on controller '${c}'`,
        };
      }

      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/11`);
      const argValues = args ? Object.values(args) : [];
      const result: CdFxReturn<T> = await controllerInstance[a](
        ...argValues,
        dat
      );
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/12`);
      return result;
    } catch (e: any) {
      CdLog.debug(`CICdRunnerService::callMethodFromCdRequest()/13`);
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
