// templates/INTERFACE_CONTRACTS.ts
interface IWorkoutState {
    workoutId: string;
    startTime: number;
    currentExerciseIndex: number;
    currentSetIndex: number;
    exercises: IExercise[];
    timerState: ITimerState;
    metadata: {
      savedAt: string;
      isPartial: boolean;
      version: string;
    };
  }
  
  interface IModalResponse {
    action: 'save-exit' | 'exit-no-save' | 'cancel' | 'recover' | 'discard';
    timestamp: number;
    metadata?: any;
  }
  
  interface ICacheService {
    saveWorkoutState(state: IWorkoutState, isPartial: boolean): Promise<boolean>;
    getWorkoutState(): Promise<IWorkoutState | null>;
    hasActiveWorkout(): Promise<boolean>;
    clearWorkoutState(): Promise<void>;
    validateState(state: IWorkoutState): boolean;
  }