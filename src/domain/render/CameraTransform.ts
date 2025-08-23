import { cameraTransform } from "./camera";

export class CameraTransform {
  static getTransform(
    camera: { x: number; y: number; zoom: number },
    width: number,
    height: number,
    dpr: number,
  ) {
    return cameraTransform(camera, width, height, dpr);
  }
}
