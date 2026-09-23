import * as THREE from "three";

export default class Renderer {
  private readonly instance: THREE.WebGLRenderer;
  constructor() {
    this.instance = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "highp",
    });

    this.init();
  }
  private init(): void {
    this.instance.outputColorSpace = THREE.SRGBColorSpace;
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
  public getDomElement(): HTMLCanvasElement {
    return this.instance.domElement;
  }
  public getInstance(): THREE.WebGLRenderer {
    return this.instance;
  }
}
