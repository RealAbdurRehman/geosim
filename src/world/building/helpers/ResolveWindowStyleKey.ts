import Config from "../config/BuildingConfig";

export default function resolveWindowStyleKey(
  buildingType: string | undefined,
): string {
  return (
    (buildingType &&
      Config.facadeTexture.window.buildingTypeToStyle[buildingType]) ??
    Config.facadeTexture.window.defaultStyle
  );
}
