import type { ProgressTrackerService } from '../services/progress-tracker.service.js';

export class ProgressTrackerController {
  private trackerService: ProgressTrackerService;

  constructor(trackerService: ProgressTrackerService) {
    this.trackerService = trackerService;
  }

  public getOverallProgress() {
    return this.trackerService.getProgress();
  }

  public trackStep(
    stepKey: string,
    state: 'pending' | 'in-progress' | 'completed' | 'failed',
    totalTasks = 0,
    completedTasks = 0,
  ) {
    this.trackerService.updateProgress(
      stepKey,
      state,
      totalTasks,
      completedTasks,
    );
  }
}
