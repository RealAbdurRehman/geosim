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
};

export default Config;
