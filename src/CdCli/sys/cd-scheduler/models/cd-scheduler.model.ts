import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Generated,
    BeforeInsert,
    BeforeUpdate,
    IsNull,
    Not,
    UpdateDateColumn
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseDescriptor, BashScriptDescriptor, EnvironmentDescriptor, EnvironmentService, MigrationDescriptor, TestingFrameworkDescriptor } from '../../dev-descriptor/index.js';
import { CdFxReturn, CdFxStateLevel, FxStateSemantics, ICdRequest } from '../../base/IBase.js';
import { CdVaultItem } from '../../cd-cli/index.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';

@Entity({
  name: 'cdScheduler',
  synchronize: false,
})
// @CdModel
export class CdSchedulerModel {

  @PrimaryGeneratedColumn({
    name: 'cd_scheduler_id',
  })
  cdSchedulerId?: number;

  @Column({
    name: 'cd_scheduler_guid',
  })
  cdSchedulerGuid!: string;

  @Column({
    name: 'cd_scheduler_name',
  })
  cdSchedulerName!: string;

  @Column({
    name: 'cd_scheduler_type_guid',
  })
  cdSchedulerTypeGuid?: number;

  @Column({
    name: 'doc_id',
  })
  docId!: number;

  @Column({
    name: 'cd_scheduler_enabled',
  })
  cdSchedulerEnabled?: boolean;

  @Column({
    name: 'cd_scheduler_description',
  })
  cd_scheduler_description?: string;
  
}

// Main CdSchedulerDescriptor Interface
export interface CdSchedulerDescriptor extends BaseDescriptor {
  dsFormart?: "json" | "csv" | "sql-db";
  cdSchedulerPipeline?: CdSchedulerPipeline; // Details of the pipeline
  cdSchedulerTriggers?: CdSchedulerTrigger; // Details of the triggers
  cdSchedulerEnvironment?: CdSchedulerEnvironment; // Details of the environment
  cdSchedulerNotifications?: CdSchedulerNotification; // Details of the notifications
  cdSchedulerMetadata?: CdSchedulerMetadata; // Metadata information
}

// Interface for Pipeline
export interface CdSchedulerPipeline extends BaseDescriptor {
  name: string; // Name of the pipeline (e.g., "Build and Deploy Pipeline")
  type: string; // Type of pipeline
  stages: CdSchedulerStage[]; // List of stages in the pipeline
}

// Interface for Triggers
export interface CdSchedulerTrigger extends BaseDescriptor {
  type: string; // Trigger type
  schedule?: string; // Cron-like schedule (e.g., "0 0 * * *")
  branchFilters?: string[]; // Branches that trigger the pipeline
  conditions?: CdSchedulerTriggerConditions; // Conditions for triggering the pipeline
}

// Interface for Environment
export interface CdSchedulerEnvironment extends BaseDescriptor {
  name: string; // Name of the environment (e.g., "staging", "production")
  url: string; // Environment URL
  type: string; // Environment type
  deploymentStrategy: string; // Deployment strategy
}

export interface CdSchedulerStage extends BaseDescriptor {
  name: string; // Name of the stage (e.g., "Build", "Test", "Deploy")
  description?: string; // Description of the stage
  tasks: CdSchedulerTask[]; // List of tasks in the stage
}

// export interface CdSchedulerTask<T = any> extends BaseDescriptor {
//   name: string;
//   type: string;
//   executor: ExecutionEnvironmentType; // Defines the execution environment
//   script?: string; // Used for inline scripts
//   cdRequest?: ICdRequest; // Optionally ICdRequest json can be used to invoke a given action
//   scriptFile?: string; // Used when the script is a file
//   className?: string; // Used when calling a cd-cli method
//   methodName?: string; // The method to be executed
//   input?: T; // Optional input for the method
//   status: string; // Task execution status
//   cdVault?: CdVaultItem[];
//   onResult?: TransitionRule[]; // Optional: Define next steps based on the result of the task
//   onError?: TransitionRule[]; // Optional: Define next steps on error
//   onSuccess?: TransitionRule[]; // Optional: Define next steps on success
//   onStart?: TransitionRule[]; // Optional: Define next steps on start
//   onEnd?: TransitionRule[]; // Optional: Define next steps on end
//   onCancel?: TransitionRule[]; // Optional: Define next steps on cancel
//   onTimeout?: TransitionRule[]; // Optional: Define next steps on timeout
//   onRetry?: TransitionRule[]; // Optional: Define next steps on retry
//   retryCount?: number; // Number of retries allowed for the task
//   retryDelay?: number; // Delay in milliseconds before retrying the task
//   timeout?: number; // Timeout in milliseconds for the task
// }
export interface BaseSchedulerTask<T = any> extends BaseDescriptor {
  name: string;
  type: string;
  executor: ExecutionEnvironmentType;
  input?: T;
  status?: string;
  cdVault?: CdVaultItem[];

  script?: string;
  scriptFile?: string;
  className?: string;
  methodName?: string;
  /**
   * Executable request that can be used to invoke a given action.
   */
  cdRequest?: ICdRequest;
  /**
   * Executable request that checks/asserts if the outcome of this task is valid.
   * If provided, the result can be used to validate or gate the transition of the task.
   */
  assert?: ICdRequest; // ← NEW: Executable assertion/test for this task


  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Define a Common Transitions Map (Optional & Type-Safe) 
 * Use this as a reusable property for components that need transitions:
 */
export type FxTransitionMap = Partial<Record<keyof typeof CdFxStateLevel, TransitionRule[]>>;

/**
 * Specializations 1:
 * CdSchedulerTask: A specialized version of BaseSchedulerTask, used for core Scheduler components.
 * It includes specific transition rules for various task states like onSuccess, onError, etc.
 * CdSchedulerTask: Used for defining tasks in the core Scheduler, with specific transitions for GUI orchestration.
 * CdSchedulerTask: High-level abstraction; used in core Scheduler components, designed for GUI orchestration.
 * CdSchedulerTask: Used within core Scheduler components, designed for GUI orchestration and intuitive onSuccess, onError, etc.
 */
export interface CdSchedulerTask<T = any> extends BaseSchedulerTask<T> {
  transitions?: Partial<Record<keyof typeof CdFxStateLevel | string, TransitionRule[]>>;
  onResult?: TransitionRule[];
  onError?: TransitionRule[];
  onSuccess?: TransitionRule[];
  onStart?: TransitionRule[];
  onEnd?: TransitionRule[];
  onCancel?: TransitionRule[];
  onTimeout?: TransitionRule[];
  onRetry?: TransitionRule[];
}


/**
 * Specializations 2:
 * GenericTask: A more flexible version of CdSchedulerTask, suitable for various task types.
 * It allows for defining transitions, metadata, and is more generic in nature.
 * GenericTask: Used for defining tasks in a more generic way, with optional transitions and metadata.
 * GenericTask: Low-level abstraction; may appear in serialized or human-readable workflows (YAML/JSON), allows looser transition labels.
 */
export interface GenericTask<T = any> extends BaseSchedulerTask<T> {
  id: string;
  metadata?: Record<string, any>;
  transitions?: FxTransitionMap;
}

// /**
//  * Specializations 3:
//  * WorkflowTask: A more structured version of CdSchedulerTask, suitable for complex workflows.
//  * It allows for defining transitions, scheduling, and retry configurations.
//  * WorkflowTask: Used for defining tasks within a workflow, with optional scheduling and retry configurations.
//  * This is a more structured version of CdSchedulerTask, suitable for complex workflows.
//  * WorkflowTask: Mid-level abstraction; may appear in serialized or human-readable workflows (YAML/JSON), allows looser transition labels.
//  */
// export interface WorkflowTask<T = any> extends BaseSchedulerTask<T> {
//   /**
//    * Transitions define conditional next steps.
//    * Keys can be either known CdFxStateLevel states (e.g., onSuccess, onError)
//    * or arbitrary string-based labels for more flexible workflows.
//    */
//   transitions?: Partial<Record<keyof typeof CdFxStateLevel | string, TransitionRule[]>>;

//   schedule?: ScheduleConfig;
//   retry?: RetryConfig;
// }
/** @deprecated Use CdSchedulerTask instead */
export type WorkflowTask<T = any> = CdSchedulerTask<T>;


export interface ScheduleConfig {
  isRecurring?: boolean;
  cron?: string;                // e.g. "0 0 * * *"
  intervalMs?: number;          // e.g. 3600000 for 1h
  runOnceAt?: string;           // ISO timestamp
  window?: ExecutionWindow;     // Define when it can run (optional)
  repeatUntil?: string;         // End date (ISO) for recurrence
  skipIfMissed?: boolean;
  catchUp?: boolean;
}

export interface ExecutionWindow {
  start: string;  // e.g. "09:00"
  end: string;    // e.g. "17:00"
  timezone?: string; // e.g. "Africa/Nairobi"
}

export interface RetryConfig {
  retryCount?: number;
  retryDelayMs?: number;
  backoff?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  tasks: Record<string, WorkflowTask>;
  startTask: string;
  globalTransitions?: TransitionRule[];
}

/**
 * GUI-Ready Flow Model
 * All tasks are treated as nodes, and transitions as edges — GUI tools can generate diagrams on the fly.
 * Transition edges can be interpreted like this:
 * 
 function extractEdgesFromTask(task: GenericTask): WorkflowEdge[] {
    return Object.entries(task.transitions || {}).flatMap(([state, rules]) => {
      return rules.map(rule => ({
        from: task.id,
        to: rule.targetTaskId,
        onState: state,
        condition: rule.condition
      }));
    });
  }
 */
export interface GenericWorkflow {
  id: string;
  name: string;
  description?: string;
  semantics?: FxStateSemantics; // Associated with CdFxReturn (Corpdesk tupule Function Return)
  tasks: GenericTask[];
}

export interface WorkflowEdge {
  from: string;                   // Source task ID
  to: string;                     // Target task ID (same as rule.toTask)
  onState: keyof typeof CdFxStateLevel | string; // Transition label (e.g. 'onSuccess', 'onError')
  condition?: string;             // JS-like conditional expression (optional)
  delayMs?: number;               // Optional delay before transition
  window?: ExecutionWindow;       // Optional time window constraint
}

export type WorkflowEdgeList = WorkflowEdge[];


export type WFNextRef = string | WFNext;

// | CdFxStateLevel[]; // 💡 Support both single and multiple
// export interface TransitionRule {
//   toTask: string;                // Target task ID
//   ifState?: CdFxStateLevel | CdFxStateLevel[];     // Optional state condition
//   ifExpr?: string;              // Optional JS-like expression (data context)
//   delayMs?: number;             // Optional delay before transitioning
//   window?: ExecutionWindow;     // Optional time window constraint
//   fallback?: boolean;
// }
export interface TransitionRule {
  toTask: WFNextRef;                          // 🆕 Supports string or WFNext object
  ifState?: CdFxStateLevel | CdFxStateLevel[];
  ifExpr?: string;
  delayMs?: number;
  window?: ExecutionWindow;
  fallback?: boolean;
}


export interface WFNext {
  pipelineName?: string;
  stageName?: string;
  taskName: string;
}

export type ExecutionEnvironmentType = string;

// Task type now allows structured descriptors
export type CdSchedulerTaskType =
  | TestingFrameworkDescriptor
  | MigrationDescriptor
  | BashScriptDescriptor // ✅ Added support for Bash scripts
  | CdSchedulerNotification;



// Interface for Trigger Conditions
export interface CdSchedulerTriggerConditions extends BaseDescriptor {
  includeTags: boolean; // Whether to include tags in triggers
  excludeBranches?: string[]; // Branches to exclude
}

// Interface for Notification Channels
export interface CdSchedulerNotificationChannel extends BaseDescriptor {
  name: string; // Name of the channel (e.g., "Slack", "Email")
  type: string; // Notification channel type
  recipients?: string[]; // List of recipients
  messageFormat?: string; // Format of the message
}

// Interface for Notifications
export interface CdSchedulerNotification extends BaseDescriptor {
  channels: CdSchedulerNotificationChannel[]; // List of notification channels
  onEvents: ("success" | "failure" | "start" | "end")[]; // Events that trigger notifications
}

// Interface for Metadata
export interface CdSchedulerMetadata extends BaseDescriptor {
  createdBy?: string; // Person or team who created the pipeline
  lastModified?: string; // Last modification date
  version?: string; // Version of the pipeline configuration
  repository?: string; // Associated repository
}




