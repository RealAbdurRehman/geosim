import Scene from "./Scene";
import Camera from "../camera/Camera";
import Renderer from "./Renderer";
import CameraControls from "../camera/CameraControls";
import Lighting from "../lighting/Lighting";

export default class Engine {
  private readonly scene: Scene;
  private readonly camera: Camera;
  private readonly renderer: Renderer;
  private readonly cameraControls: CameraControls;
  constructor() {
    this.scene = new Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.cameraControls = new CameraControls(
      this.camera.instance,
      this.renderer.getDomElement(),
    );

    new Lighting(this.scene.instance);
  }
  public init(): void {
    this.addEventListeners();
    window.requestAnimationFrame(this.animate);
  }
  private render(): void {
    this.renderer.render(this.scene.instance, this.camera.instance);
  }
  private update(): void {
    this.cameraControls.update();
  }
  private animate = (): void => {
    window.requestAnimationFrame(this.animate);

    this.update();
    this.render();
  };
  private resize = (): void => {
    this.camera.resize();
    this.renderer.resize();
  };
  private addEventListeners(): void {
    window.addEventListener("resize", this.resize);
  }
}
