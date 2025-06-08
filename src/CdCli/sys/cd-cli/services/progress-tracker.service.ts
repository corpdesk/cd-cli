import type { CdFxReturn } from '../../base/IBase.js';
import type {
  ProgressTrackerModel,
  StepProgress,
} from '../models/progress-tracker.model.js';

export class ProgressTrackerService {
  private progressTracker: ProgressTrackerModel;

  private stepMap: {
    key: string;
    method: () => Promise<CdFxReturn<null>>;
    totalTasks: number;
    completedTasks: number;
  }[] = [];

  constructor() {
    this.progressTracker = {
      steps: {},
      aggregate: { totalTasks: 0, completedTasks: 0 },
    };
  }

  public updateProgress(
    stepKey: string,
    state: StepProgress['state'],
    totalTasks: number = 0,
    completedTasks: number = 0,
  ): void {
    if (!this.progressTracker.steps[stepKey]) {
      this.progressTracker.steps[stepKey] = {
        state: 'pending',
        totalTasks,
        completedTasks,
      };
    }

    this.progressTracker.steps[stepKey].state = state;
    this.progressTracker.steps[stepKey].totalTasks = totalTasks;
    this.progressTracker.steps[stepKey].completedTasks = completedTasks;

    // Update aggregate tracking
    this.progressTracker.aggregate.totalTasks = Object.values(
      this.progressTracker.steps,
    ).reduce((acc, step) => acc + step.totalTasks, 0);
    this.progressTracker.aggregate.completedTasks = Object.values(
      this.progressTracker.steps,
    ).reduce((acc, step) => acc + step.completedTasks, 0);
  }

  public getProgress(): ProgressTrackerModel {
    return this.progressTracker;
  }

  public registerStep(
    key: string,
    method: () => Promise<CdFxReturn<null>>,
    totalTasks: number = 1,
  ) {
    this.stepMap.push({ key, method, totalTasks, completedTasks: 0 });
    this.progressTracker.steps[key] = {
      state: 'pending',
      totalTasks,
      completedTasks: 0,
    };
  }

  public getSteps() {
    return this.stepMap;
  }
}
