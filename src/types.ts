export interface PauseInterval {
  id: string;
  index: number;
  durationMs: number;
  startedAt: number; // timestamp
  completedAt?: number; // timestamp
  stopwatchTimeAtPauseMs: number; // what was the stopwatch time when paused
  isCompleted: boolean;
}

export interface WorkoutSession {
  elapsedTimeMs: number;
  isRunning: boolean;
  hasStarted: boolean;
  pauses: PauseInterval[];
}
