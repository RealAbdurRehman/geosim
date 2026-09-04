import * as THREE from "three";

import Config from "../config/ThreeConfig";
import enableLightShadow from "../../utils/enableLightShadow";

export default class Lighting {
  private readonly ambientLight: THREE.AmbientLight;
  private readonly hemisphereLight: THREE.HemisphereLight;
  private readonly keyLight: THREE.DirectionalLight;
  constructor(scene: THREE.Scene) {
    this.ambientLight = this.createAmbientLight();
    this.hemisphereLight = this.createHemisphereLight();
    this.keyLight = this.createKeyLight();

    this.init(scene);
  }
  private init(scene: THREE.Scene): void {
    scene.add(this.ambientLight, this.hemisphereLight, this.keyLight);
  }
  private createAmbientLight(): THREE.AmbientLight {
    const config = Config.lighting.ambientLight;
    return new THREE.AmbientLight(config.color, config.intensity);
  }
  private createHemisphereLight(): THREE.HemisphereLight {
    const config = Config.lighting.hemisphereLight;
    return new THREE.HemisphereLight(
      config.skyColor,
      config.groundColor,
      config.intensity,
    );
  }
  private createKeyLight(): THREE.DirectionalLight {
    const config = Config.lighting.sun;
    const keyLight = new THREE.DirectionalLight(config.color, config.intensity);

    keyLight.position.copy(config.position);
    enableLightShadow({ light: keyLight });

    return keyLight;
  }
}
