declare module 'cli-progress' {
  export interface SingleBarOptions {
    format?: string;
    barCompleteChar?: string;
    barIncompleteChar?: string;
    hideCursor?: boolean;
  }

  export class SingleBar {
    constructor(options: SingleBarOptions);
    start(total: number, startValue: number): void;
    update(current: number): void;
    stop(): void;
  }
}

