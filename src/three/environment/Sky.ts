import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

import Config from "../config/ThreeConfig";

export default class EnvironmentSky {
  private readonly sky: Sky;
  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.sky = new Sky();
    this.init(scene, renderer);
  }
  private init(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    this.sky.scale.setScalar(450000);
    scene.add(this.sky);
    this.configure();
    this.generateEnvironmentMap(scene, renderer);
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
  private generateEnvironmentMap(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
  ): void {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const tempScene = new THREE.Scene();
    tempScene.add(this.sky.clone());

    const groundGeo = new THREE.PlaneGeometry(100000, 100000);
    const groundMat = new THREE.MeshBasicMaterial({
      color: Config.lighting.hemisphereLight.groundColor,
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    tempScene.add(ground);

    const envMap = pmremGenerator.fromScene(tempScene).texture;
    scene.environment = envMap;
    scene.environmentIntensity = Config.environment.intensity;
    pmremGenerator.dispose();
  }
}
