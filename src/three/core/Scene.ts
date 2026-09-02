import * as THREE from "three";

export default class Scene {
  public readonly instance: THREE.Scene;
  constructor() {
    this.instance = new THREE.Scene();
    this.init();
  }
  private init(): void {
    this.instance.background = new THREE.Color(0x1a1c23);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
    );
    this.instance.add(mesh);
  }
}
