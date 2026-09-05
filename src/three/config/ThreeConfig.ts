import * as THREE from "three";

const Config = {
  camera: {
    fov: 60,
    near: 1.0,
    far: 10000,
    start: new THREE.Vector3(0, 400, 1000),
    controls: { enablePan: true, enableDamping: true, maxDistance: 7000 },
  },
  lighting: {
    ambientLight: {
      color: 0xffffff,
      intensity: 0.3,
    },
    hemisphereLight: {
      skyColor: 0x87ceeb,
      groundColor: 0x444444,
      intensity: 0.6,
    },
    sun: {
      position: new THREE.Vector3(4, 25, 5),
      color: 0xffffff,
      intensity: 1.5,
    },
  },
  sky: {
    turbidity: 0.4,
    rayleigh: 0.3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.9,
  },
  clouds: {
    enabled: true,
    transform: {
      position: new THREE.Vector3(0, 950, 0),
      scale: new THREE.Vector3(3200, 1400, 3200),
    },
    lighting: {
      sunColor: 0xffffff,
      sunIntensity: 3.2,
      ambientColor: 0xeef4ff,
      ambientIntensity: 2.0,
      cloudColor: 0xffffff,
    },
    texture: {
      size: 64,
      coverage: 0.53,
      softness: 0.07,
      noiseScale: 4.0,
      octaves: 4,
      persistence: 0.52,
      lacunarity: 2.6,
      noiseIntensity: 1.0,
      seed: 42,
    },
    mask: {
      resolution: 48,
      radius: 0.54,
      softness: 0.15,
      flattenTop: 0.8,
      flattenBottom: 0.35,
      flattenXPos: 0.9,
      flattenXNeg: 0.9,
      flattenZPos: 0.9,
      flattenZNeg: 0.9,
      noiseStrength: 0.08,
      noiseFrequency: 2.8,
      seed: 1,
      detailNoiseStrength: 0.045,
      detailNoiseFrequency: 11.0,
      detailSeed: 10,
      visualizeMask: false,
    },
    rendering: {
      textureTiling: 2.0,
      densityThreshold: 0.0,
      densityMultiplier: 22.0,
      opacity: 2.2,
      raymarchSteps: 36,
      lightSteps: 1,
    },
    animation: {
      enabled: true,
      speed: new THREE.Vector3(0.02, 0.0, 0.01),
    },
  },
};

export default Config;
