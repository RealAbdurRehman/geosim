import * as THREE from "three";

import Scene from "./Scene";
import Camera from "../camera/Camera";
import Renderer from "./Renderer";
import CameraControls from "../camera/CameraControls";
import Lighting from "../lighting/Lighting";
import EnvironmentSky from "../environment/Sky";
import Clouds from "../environment/clouds/Clouds";

export default class Engine {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly renderer: Renderer;
  private readonly cameraControls: CameraControls;
  private readonly lighting: Lighting;
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

    new EnvironmentSky(this.scene.instance);

    this.lighting = new Lighting(this.scene.instance);
    this.clouds = new Clouds(this.lighting.getSun());

    this.timer = new THREE.Timer();
  }
  public init(): void {
    this.addEventListeners();
    window.requestAnimationFrame(this.animate);
  }
  private render(): void {
    this.renderer.render(this.scene.instance, this.camera.instance);
    this.clouds.render(this.renderer.getInstance(), this.camera.instance);
  }
  private update(): void {
    const delta = this.timer.getDelta();

    this.cameraControls.update();
    this.clouds.update(delta, this.camera.instance, this.lighting.getSun());
  }
  private animate = (): void => {
    window.requestAnimationFrame(this.animate);

    this.update();
    this.render();
  };
  private resize = (): void => {
    this.camera.resize();
    this.renderer.resize();
    this.clouds.resize(window.innerWidth, window.innerHeight);
  };
  private addEventListeners(): void {
    window.addEventListener("resize", this.resize);
  }
  public add(object: THREE.Object3D): void {
    this.scene.instance.add(object);
  }
}
