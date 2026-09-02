import * as THREE from "three";

import Config from "../config/ThreeConfig";

export default class Camera {
  public readonly instance: THREE.PerspectiveCamera;
  constructor() {
    this.instance = new THREE.PerspectiveCamera(
      Config.camera.fov,
      window.innerWidth / window.innerHeight,
      Config.camera.near,
      Config.camera.far,
    );

    this.init();
  }
  private init(): void {
    const start = Config.camera.start;
    this.instance.position.set(start.x, start.y, start.z);
  }
  public resize(): void {
    this.instance.aspect = window.innerWidth / window.innerHeight;
    this.instance.updateProjectionMatrix();
  }
}
