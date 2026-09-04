import * as THREE from "three";

const Config = {
  camera: {
    fov: 60,
    near: 0.1,
    far: 10000,
    start: new THREE.Vector3(0, 400, 1000),
    controls: { enablePan: true, enableDamping: true, maxDistance: 3000 },
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
    bottom: 900,
    top: 1600,
    size: 10000,
    density: 0.55,
    coverage: 0.48,
    baseStrength: 0.78,
    detailStrength: 0.18,
    windSpeed: 8.0,
    stepsMin: 16,
    stepsMax: 64,
    lightSteps: 4,
    lightMultiplier: 4.0,
    ambientStrength: 0.12,
    extinction: 0.8,
    detailDistance: 1800,
    renderOrder: 10,
  },
};

export default Config;
