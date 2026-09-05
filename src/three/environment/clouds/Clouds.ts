import * as THREE from "three";

import Config from "../../config/ThreeConfig";
import CloudNoise from "./CloudNoise";

import vertexShader from "./CloudVertex.glsl";
import fragmentShader from "./CloudShader.glsl";

export default class Clouds {
  private noiseTexture: THREE.Data3DTexture;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial>;
  private scene: THREE.Scene;
  private target: THREE.WebGLRenderTarget;
  private quadScene: THREE.Scene;
  private quadCamera: THREE.OrthographicCamera;
  private quadMaterial: THREE.MeshBasicMaterial;
  constructor(sun: THREE.DirectionalLight) {
    this.noiseTexture = CloudNoise.create(128);
    this.material = this.createMaterial(sun);

    const geometry = new THREE.BoxGeometry(
      Config.clouds.size,
      Config.clouds.top - Config.clouds.bottom,
      Config.clouds.size,
    );
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.y = (Config.clouds.bottom + Config.clouds.top) * 0.5;

    this.scene = new THREE.Scene();
    this.scene.add(this.mesh);

    const scale = Config.clouds.resolutionScale;
    this.target = new THREE.WebGLRenderTarget(
      window.innerWidth * scale,
      window.innerHeight * scale,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: THREE.HalfFloatType,
      },
    );

    this.quadMaterial = new THREE.MeshBasicMaterial({
      map: this.target.texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene = new THREE.Scene();
    this.quadScene.add(
      new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.quadMaterial),
    );
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  private createMaterial(sun: THREE.DirectionalLight): THREE.ShaderMaterial {
    const sunDirection = sun.position.clone().normalize().negate();
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      glslVersion: THREE.GLSL3,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        cloudNoise: { value: this.noiseTexture },
        sunDirection: { value: sunDirection },
        cloudCenter: { value: new THREE.Vector3() },
        cloudBottom: { value: Config.clouds.bottom },
        cloudTop: { value: Config.clouds.top },
        cloudDensity: { value: Config.clouds.density },
        cloudCoverage: { value: Config.clouds.coverage },
        baseStrength: { value: Config.clouds.baseStrength },
        detailStrength: { value: Config.clouds.detailStrength },
        windSpeed: { value: Config.clouds.windSpeed },
        sunIntensity: { value: Config.clouds.lightMultiplier },
        ambientStrength: { value: Config.clouds.ambientStrength },
        extinction: { value: Config.clouds.extinction },
        detailDistance: { value: Config.clouds.detailDistance },
        noiseScale: { value: Config.clouds.noiseScale },
        stepsMin: { value: Config.clouds.stepsMin },
        stepsMax: { value: Config.clouds.stepsMax },
        time: { value: 0 },
      },
    });
  }
  public update(
    delta: number,
    camera: THREE.Camera,
    sun: THREE.DirectionalLight,
  ): void {
    const u = this.material.uniforms;
    u.time.value += delta;

    this.mesh.position.x = camera.position.x;
    this.mesh.position.z = camera.position.z;
    u.cloudCenter.value.set(camera.position.x, 0, camera.position.z);

    (u.sunDirection.value as THREE.Vector3)
      .copy(sun.position)
      .normalize()
      .negate();
  }
  public render(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(this.scene, camera);

    renderer.setRenderTarget(null);
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.quadScene, this.quadCamera);
    renderer.autoClear = autoClear;
  }
  public resize(width: number, height: number): void {
    const scale = Config.clouds.resolutionScale;
    this.target.setSize(width * scale, height * scale);
  }
  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.noiseTexture.dispose();
    this.target.dispose();
    this.quadMaterial.dispose();
  }
}
