import * as THREE from "three";

export default class Renderer {
  private readonly instance: THREE.WebGLRenderer;
  constructor() {
    this.instance = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance",
      precision: "highp",
    });

    this.init();
  }
  private init(): void {
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.2;
    this.instance.shadowMap.enabled = true;
    this.instance.shadowMap.type = THREE.PCFShadowMap;
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.resize();

    const display = document.getElementById("display")!;
    display.appendChild(this.instance.domElement);
  }
  public resize(): void {
    this.instance.setSize(window.innerWidth, window.innerHeight);
  }
  public render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.instance.render(scene, camera);
  }
  public getDomElement(): HTMLElement {
    return this.instance.domElement;
  }
}
