import {
  type CiCdDescriptor,
  getCiCdByName,
  knownCiCds,
} from '../models/cicd-descriptor.model.js';
/* eslint-disable style/brace-style */
import { CD_FX_FAIL, type CdFxReturn } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';

export class CiCdService extends GenericService<CdObjModel> {
  constructor() {
    super(CdObjModel);
  }
  static async initializeStepMap<T extends { ciCd: CiCdDescriptor[] }>(
    context: any, // Service context (EnvironmentService, EnvironmentService, etc.)
    input: T,
    progressTracker: any, // Progress tracking service
  ): Promise<CdFxReturn<null>> {
    let allSuccessful = true; // Track overall success
    for (const ciCdDescriptor of input.ciCd) {
      if (!ciCdDescriptor.cICdPipeline || !ciCdDescriptor.cICdPipeline.stages) {
        CdLog.warning(
          `Skipping descriptor: cICdPipeline or its stages are undefined.`,
        );
        allSuccessful = false;
        continue;
      }
      for (const stage of ciCdDescriptor.cICdPipeline.stages) {
        for (const task of stage.tasks) {
          const methodName = task.methodName;
          if (methodName && typeof context[methodName] === 'function') {
            // Resolve method dynamically
            const method = context[methodName] as (
              input?: T,
            ) => Promise<CdFxReturn<null>>;

            progressTracker.registerStep(
              task.name,
              async () => {
                try {
                  const result = await method(input); // ✅ Await method call
                  if (!result.state) {
                    allSuccessful = false; // If any task fails, mark overall failure
                    CdLog.error(
                      `Task "${task.name}" failed: ${result.message || 'Unknown error'}`,
                    );
                  }
                  return result;
                } catch (error) {
                  allSuccessful = false; // Mark failure on exception
                  CdLog.error(
                    `Task "${task.name}" encountered an error: ${error}`,
                  );
                  return {
                    state: false,
                    data: null,
                    message: `Exception: ${error}`,
                  };
                }
              },
              0,
            );
          } else {
            CdLog.warning(
              `Skipping task "${task.name}": No valid method found.`,
            );
            allSuccessful = false;
          }
        }
      }
    }

    // Return aggregated success/failure response
    return {
      state: allSuccessful,
      data: null,
      message: allSuccessful
        ? 'All tasks executed successfully'
        : 'Some tasks failed. Check logs for details.',
    };
  }

  async getCiCdByName(name): Promise<CdFxReturn<CiCdDescriptor>> {
    const ret = getCiCdByName(name, knownCiCds);
    if (!ret) {
      return {
        data: null,
        state: false,
        message: 'The data is invalid',
      };
    } else {
      return {
        data: ret,
        state: true,
      };
    }
  }
}
