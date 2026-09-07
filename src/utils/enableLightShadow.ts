import * as THREE from "three";

interface EnableLightShadowOptions {
  light: THREE.DirectionalLight;
  far?: number;
  mapSize?: {
    width: number;
    height: number;
  };
  d?: number;
}

export default function enableLightShadow({
  light,
  far = 700,
  mapSize = { width: 2048, height: 2048 },
  d = 550,
}: EnableLightShadowOptions): void {
  light.castShadow = true;

  light.shadow.camera.near = 1.0;
  light.shadow.camera.far = far;

  light.shadow.bias = -0.0002;
  light.shadow.normalBias = 0.02;
  light.shadow.mapSize.set(mapSize.width, mapSize.height);

  light.shadow.camera.top = d;
  light.shadow.camera.right = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.left = -d;

  light.shadow.camera.updateProjectionMatrix();

  light.shadow.autoUpdate = false;
  light.shadow.needsUpdate = true;
}
