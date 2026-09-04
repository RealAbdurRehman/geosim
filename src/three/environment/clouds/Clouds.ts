import * as THREE from "three";

import Config from "../../config/ThreeConfig";
import CloudNoise from "./CloudNoise";

import vertexShader from "./CloudVertex.glsl";
import fragmentShader from "./CloudShader.glsl";

export default class Clouds {
  private readonly mesh: THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial>;

  private readonly material: THREE.ShaderMaterial;

  private readonly noiseTexture: THREE.Data3DTexture;

  constructor(scene: THREE.Scene, sun: THREE.DirectionalLight) {
    this.noiseTexture = CloudNoise.create(64);

    this.material = this.createMaterial(sun);

    const geometry = new THREE.BoxGeometry(
      Config.clouds.size,
      Config.clouds.top - Config.clouds.bottom,
      Config.clouds.size,
    );

    this.mesh = new THREE.Mesh(geometry, this.material);

    this.mesh.position.set(
      0,
      (Config.clouds.bottom + Config.clouds.top) * 0.5,
      0,
    );

    this.mesh.renderOrder = Config.clouds.renderOrder;

    /*
     * We are rendering the inside of
     * the volume.
     */
    this.material.side = THREE.BackSide;

    /*
     * Clouds should blend with the scene,
     * but should not write depth.
     */
    this.material.transparent = true;

    this.material.depthWrite = false;

    this.material.depthTest = true;

    scene.add(this.mesh);
  }

  private createMaterial(sun: THREE.DirectionalLight): THREE.ShaderMaterial {
    const sunDirection = new THREE.Vector3();

    sunDirection.copy(sun.position).normalize().negate();

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,

      transparent: true,

      side: THREE.BackSide,

      depthWrite: false,
      depthTest: true,

      uniforms: {
        cloudNoise: {
          value: this.noiseTexture,
        },

        sunDirection: {
          value: sunDirection,
        },

        cloudCenter: {
          value: new THREE.Vector3(0, 0, 0),
        },

        cloudBottom: {
          value: Config.clouds.bottom,
        },

        cloudTop: {
          value: Config.clouds.top,
        },

        cloudDensity: {
          value: Config.clouds.density,
        },

        cloudCoverage: {
          value: Config.clouds.coverage,
        },

        baseStrength: {
          value: Config.clouds.baseStrength,
        },

        detailStrength: {
          value: Config.clouds.detailStrength,
        },

        windSpeed: {
          value: Config.clouds.windSpeed,
        },

        sunIntensity: {
          value: Config.clouds.lightMultiplier,
        },

        ambientStrength: {
          value: Config.clouds.ambientStrength,
        },

        extinction: {
          value: Config.clouds.extinction,
        },

        detailDistance: {
          value: Config.clouds.detailDistance,
        },

        noiseScale: {
          value: 0.00055,
        },

        cameraDistance: {
          value: 0,
        },

        time: {
          value: 0,
        },
      },
    });
  }

  public update(
    delta: number,
    camera: THREE.Camera,
    sun: THREE.DirectionalLight,
  ): void {
    const uniforms = this.material.uniforms;

    uniforms["time"].value += delta;

    /*
     * Keep the cloud volume centered
     * around the camera.

     * This makes the cloud layer effectively
     * infinite for the player.
     */
    this.mesh.position.x = camera.position.x;

    this.mesh.position.z = camera.position.z;

    uniforms["cloudCenter"].value.set(camera.position.x, 0, camera.position.z);

    uniforms["cameraDistance"].value = camera.position.length();

    /*
     * Update sun direction dynamically.

     * This means changing the sun's position
     * automatically changes cloud lighting.
     */
    const sunDirection = uniforms["sunDirection"].value as THREE.Vector3;

    sunDirection.copy(sun.position).normalize().negate();
  }

  public dispose(): void {
    this.mesh.geometry.dispose();

    this.material.dispose();

    this.noiseTexture.dispose();
  }
}
