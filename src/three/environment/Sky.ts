import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

import Config from "../config/ThreeConfig";

export default class EnvironmentSky {
  private readonly sky: Sky;
  constructor(scene: THREE.Scene) {
    this.sky = new Sky();
    this.init(scene);
  }
  private init(scene: THREE.Scene): void {
    this.sky.scale.setScalar(450000);
    scene.add(this.sky);
    this.configure();
  }
  private configure(): void {
    const config = Config.sky;
    const uniforms = this.sky.material.uniforms;

    uniforms["turbidity"].value = config.turbidity;
    uniforms["rayleigh"].value = config.rayleigh;
    uniforms["mieCoefficient"].value = config.mieCoefficient;
    uniforms["mieDirectionalG"].value = config.mieDirectionalG;

    const sunPosition = Config.lighting.sun.position.clone().normalize();
    uniforms["sunPosition"].value.copy(sunPosition);
  }
}
