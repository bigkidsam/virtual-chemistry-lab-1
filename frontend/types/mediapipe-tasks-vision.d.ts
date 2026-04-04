declare module "@mediapipe/tasks-vision" {
  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
  }

  export interface Category {
    categoryName?: string;
  }

  export interface HandLandmarkerResult {
    landmarks?: NormalizedLandmark[][];
    handedness?: Category[][];
  }

  export interface HandLandmarkerOptions {
    baseOptions: {
      modelAssetPath: string;
      delegate?: "GPU" | "CPU";
    };
    runningMode: "VIDEO" | "IMAGE" | "LIVE_STREAM";
    numHands?: number;
    minHandDetectionConfidence?: number;
    minHandPresenceConfidence?: number;
    minTrackingConfidence?: number;
  }

  export class FilesetResolver {
    static forVisionTasks(basePath: string): Promise<unknown>;
  }

  export class HandLandmarker {
    static createFromOptions(
      vision: unknown,
      options: HandLandmarkerOptions,
    ): Promise<HandLandmarker>;

    detectForVideo(
      videoFrame: HTMLVideoElement,
      timestamp: number,
    ): HandLandmarkerResult;
  }
}
