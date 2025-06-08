export interface StepProgress {
  state: 'pending' | 'in-progress' | 'completed' | 'failed';
  totalTasks: number;
  completedTasks: number;
}

export interface ProgressTrackerModel {
  steps: Record<string, StepProgress>;
  aggregate: { totalTasks: number; completedTasks: number };
}
