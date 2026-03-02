// Type declaration to satisfy TypeScript when @types/node-cron is not installed.
// Minimal ambient module declaration to avoid "Could not find a declaration file for module 'node-cron'".
declare module "node-cron" {
  type ScheduleCallback = (...args: any[]) => any;
  interface ScheduledTask {
    start(): void;
    stop(): void;
    destroy(): void;
    readonly running: boolean;
  }

  interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
  }

  export function schedule(
    expression: string,
    callback: ScheduleCallback,
    options?: ScheduleOptions,
  ): ScheduledTask;

  export function validate(expression: string): boolean;
  export function getTasks(): Record<string, ScheduledTask>;

  const _default: {
    schedule: typeof schedule;
    validate: typeof validate;
    getTasks: typeof getTasks;
  };

  export default _default;
}
