import * as THREE from "three";
import Config from "../config/ThreeConfig";
import vertexShader from "../shaders/cloud.vert.glsl";
import fragmentShader from "../shaders/cloud.frag.glsl";
import {
  bake3DCloudVolume,
  bake3DSphericalNoise,
  createProceduralDitherTexture,
} from "../noise/NoiseTexture";

export default class Clouds {
  private volumeTexture: THREE.Data3DTexture | null = null;
  private maskNoiseMap: THREE.Data3DTexture | null = null;
  private maskDetailMap: THREE.Data3DTexture | null = null;

  private readonly material: THREE.ShaderMaterial;
  private readonly ditherTexture: THREE.DataTexture;

  public readonly mesh: THREE.Mesh;
  public readonly depthTarget: THREE.WebGLRenderTarget;
  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    const size = new THREE.Vector2();
    if (renderer) renderer.getDrawingBufferSize(size);
    else
      size.set(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio,
      );

    this.depthTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    this.depthTarget.depthTexture = new THREE.DepthTexture(size.x, size.y);
    this.depthTarget.depthTexture.format = THREE.DepthFormat;
    this.depthTarget.depthTexture.type = THREE.UnsignedIntType;

    this.ditherTexture = createProceduralDitherTexture(64);
    this.material = this.createMaterial(size);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = 0;

    this.applyTransform();
    this.bakeTextures();

    scene.add(this.mesh);
  }
  private createMaterial(size: THREE.Vector2): THREE.ShaderMaterial {
    const { mask, rendering, lighting } = Config.clouds;

    return new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        cameraPos: { value: new THREE.Vector3() },
        uVolumeTexture: { value: null },
        uBlueNoise: { value: this.ditherTexture },
        uBlueNoiseSize: { value: new THREE.Vector2(64, 64) },
        uResolution: { value: size },
        uDepthTexture: { value: this.depthTarget.depthTexture },
        uModelViewMatrix: { value: new THREE.Matrix4() },
        uCameraNear: { value: Config.camera.near },
        uCameraFar: { value: Config.camera.far },
        uIsLogDepth: { value: true },
        uSunColor: { value: new THREE.Color(lighting.sunColor) },
        uSunIntensity: { value: lighting.sunIntensity },
        uLightDir: { value: Config.lighting.sun.position.clone().normalize() },
        uAmbientColor: { value: new THREE.Color(lighting.ambientColor) },
        uAmbientIntensity: { value: lighting.ambientIntensity },
        uCloudColor: { value: new THREE.Color(lighting.cloudColor) },
        uOpacity: { value: rendering.opacity },
        uMaxSteps: { value: rendering.raymarchSteps },
        uLightSteps: { value: rendering.lightSteps },
        uDensityThreshold: { value: rendering.densityThreshold },
        uDensityMultiplier: { value: rendering.densityMultiplier },
        uTextureOffset: { value: new THREE.Vector3() },
        uTextureTiling: { value: rendering.textureTiling },
        u_mask_raio: { value: mask.radius },
        u_mask_achatamentoCima: { value: mask.flattenTop },
        u_mask_achatamentoBaixo: { value: mask.flattenBottom },
        u_mask_achatamentoXpos: { value: mask.flattenXPos },
        u_mask_achatamentoXneg: { value: mask.flattenXNeg },
        u_mask_achatamentoZpos: { value: mask.flattenZPos },
        u_mask_achatamentoZneg: { value: mask.flattenZNeg },
        u_mask_softness: { value: mask.softness },
        u_mask_forcaRuido: { value: mask.noiseStrength },
        u_mask_noiseMap: { value: null },
        u_mask_forcaRuidoDetalhe: { value: mask.detailNoiseStrength },
        u_mask_noiseDetailMap: { value: null },
        u_mask_visualize: { value: mask.visualizeMask },
      },
    });
  }
  public renderDepth(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
  ): void {
    if (!Config.clouds.enabled) return;

    this.mesh.visible = false;

    const currentTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(this.depthTarget);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(currentTarget);

    this.mesh.visible = true;
  }
  public bakeTextures(): void {
    const { texture: tConf, mask: mConf } = Config.clouds;

    if (this.volumeTexture) this.volumeTexture.dispose();
    this.volumeTexture = bake3DCloudVolume({
      size: tConf.size,
      noiseScale: tConf.noiseScale,
      seed: tConf.seed,
      octaves: tConf.octaves,
      persistence: tConf.persistence,
      lacunarity: tConf.lacunarity,
      noiseIntensity: tConf.noiseIntensity,
      coverage: tConf.coverage,
      softness: tConf.softness,
    });
    this.material.uniforms.uVolumeTexture.value = this.volumeTexture;

    if (this.maskNoiseMap) this.maskNoiseMap.dispose();

    this.maskNoiseMap = bake3DSphericalNoise(
      mConf.resolution,
      mConf.seed,
      mConf.noiseFrequency,
    );
    this.material.uniforms.u_mask_noiseMap.value = this.maskNoiseMap;

    if (this.maskDetailMap) this.maskDetailMap.dispose();

    this.maskDetailMap = bake3DSphericalNoise(
      mConf.resolution,
      mConf.detailSeed,
      mConf.detailNoiseFrequency,
    );
    this.material.uniforms.u_mask_noiseDetailMap.value = this.maskDetailMap;
  }
  public applyTransform(): void {
    const { position, scale } = Config.clouds.transform;
    this.mesh.position.copy(position);
    this.mesh.scale.copy(scale);
  }
  public update(camera: THREE.Camera, delta: number): void {
    if (!Config.clouds.enabled) {
      this.mesh.visible = false;
      return;
    }

    this.mesh.visible = true;

    this.material.uniforms.cameraPos.value.copy(camera.position);
    this.material.uniforms.uLightDir.value
      .copy(Config.lighting.sun.position)
      .normalize();
    this.material.uniforms.uCameraNear.value = (
      camera as THREE.PerspectiveCamera
    ).near;
    this.material.uniforms.uCameraFar.value = (
      camera as THREE.PerspectiveCamera
    ).far;
    this.material.uniforms.uModelViewMatrix.value.multiplyMatrices(
      camera.matrixWorldInverse,
      this.mesh.matrixWorld,
    );

    if (Config.clouds.animation.enabled) {
      const offset = this.material.uniforms.uTextureOffset
        .value as THREE.Vector3;
      const speed = Config.clouds.animation.speed;
      offset.x = (offset.x + speed.x * delta) % 1.0;
      offset.y = (offset.y + speed.y * delta) % 1.0;
      offset.z = (offset.z + speed.z * delta) % 1.0;
    }
  }
  public resize(renderer?: THREE.WebGLRenderer): void {
    const size = new THREE.Vector2();
    if (renderer) renderer.getDrawingBufferSize(size);
    else
      size.set(
        window.innerWidth * window.devicePixelRatio,
        window.innerHeight * window.devicePixelRatio,
      );

    this.depthTarget.setSize(size.x, size.y);
    this.material.uniforms.uResolution.value.copy(size);
  }
}
