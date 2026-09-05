import * as THREE from "three";

import Scene from "./Scene";
import Camera from "../camera/Camera";
import Renderer from "./Renderer";
import CameraControls from "../camera/CameraControls";
import Lighting from "../lighting/Lighting";
import EnvironmentSky from "../environment/Sky";
import Clouds from "../environment/Clouds";

export default class Engine {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly renderer: Renderer;
  private readonly cameraControls: CameraControls;
  private readonly clouds: Clouds;
  private readonly timer: THREE.Timer;
  constructor() {
    this.scene = new Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.cameraControls = new CameraControls(
      this.camera.instance,
      this.renderer.getDomElement(),
    );

    this.timer = new THREE.Timer();

    new EnvironmentSky(this.scene.instance);
    new Lighting(this.scene.instance);

    this.clouds = new Clouds(this.scene.instance, this.renderer.getInstance());
  }
  public init(): void {
    this.addEventListeners();
    window.requestAnimationFrame(this.animate);
  }
  private render(): void {
    this.clouds.renderDepth(
      this.renderer.getInstance(),
      this.scene.instance,
      this.camera.instance,
    );
    this.renderer.render(this.scene.instance, this.camera.instance);
  }
  private update(timestamp?: number): void {
    this.timer.update(timestamp);
    const delta = this.timer.getDelta();

    this.cameraControls.update();
    this.clouds.update(this.camera.instance, delta);
  }
  private animate = (timestamp: number): void => {
    window.requestAnimationFrame(this.animate);

    this.update(timestamp);
    this.render();
  };
  private resize = (): void => {
    this.camera.resize();
    this.renderer.resize();
    this.clouds.resize(this.renderer.getInstance());
  };
  private addEventListeners(): void {
    window.addEventListener("resize", this.resize);
  }
  public add(object: THREE.Object3D): void {
    this.scene.instance.add(object);
  }
}
