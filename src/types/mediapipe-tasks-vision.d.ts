declare module "@mediapipe/tasks-vision" {
  export type Category = {
    categoryName: string;
    score: number;
    index: number;
    displayName: string;
  };
  export type Classifications = {
    categories: Category[];
    headIndex: number;
    headName?: string;
  };
  export type NormalizedLandmark = { x: number; y: number; z: number; visibility: number };

  export interface FaceLandmarkerResult {
    faceLandmarks: NormalizedLandmark[][];
    faceBlendshapes?: Classifications[];
  }

  export interface PoseLandmarkerResult {
    landmarks: NormalizedLandmark[][];
  }

  export class FaceLandmarker {
    static createFromOptions(
      wasm: WasmFileset,
      options: Record<string, unknown>
    ): Promise<FaceLandmarker>;
    detectForVideo(videoFrame: HTMLVideoElement, timestamp: number): FaceLandmarkerResult;
    close(): void;
  }

  export class PoseLandmarker {
    static createFromOptions(
      wasm: WasmFileset,
      options: Record<string, unknown>
    ): Promise<PoseLandmarker>;
    detectForVideo(videoFrame: HTMLVideoElement, timestamp: number): PoseLandmarkerResult;
    close(): void;
  }

  export class FilesetResolver {
    static forVisionTasks(basePath?: string, useModule?: boolean): Promise<WasmFileset>;
  }

  export type WasmFileset = unknown;
}
