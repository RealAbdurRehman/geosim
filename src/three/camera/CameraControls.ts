import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import Config from "../config/Config";

export default class CameraControls {
  private readonly instance: OrbitControls;
  constructor(camera: THREE.Camera, domElement: HTMLElement) {
    this.instance = new OrbitControls(camera, domElement);
    this.init();
  }
  private init(): void {
    const config = Config.camera.controls;
    this.instance.enablePan = config.enablePan;
    this.instance.enableDamping = config.enableDamping;
    this.instance.maxDistance = config.maxDistance;
  }
  public update(): void {
    this.instance.update();
  }
}
