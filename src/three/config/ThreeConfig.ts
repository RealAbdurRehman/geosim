import * as THREE from "three";

const Config = {
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    start: new THREE.Vector3(0, 1, 3),
    controls: { enablePan: true, enableDamping: true, maxDistance: 750 },
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
    keyLight: {
      color: 0xffffff,
      intensity: 1.5,
      position: new THREE.Vector3(4, 25, 5),
    },
  },
};

export default Config;
