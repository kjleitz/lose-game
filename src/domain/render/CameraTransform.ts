import { cameraTransform } from "./camera";
import type { Camera } from "./camera";

export class CameraTransform {
  static getTransform(
    camera: Camera,
    width: number,
    height: number,
    dpr: number,
  ): [number, number, number, number, number, number] {
    return cameraTransform(camera, width, height, dpr);
  }
}
