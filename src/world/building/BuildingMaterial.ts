import * as THREE from "three";

import Config from "./config/BuildingConfig";
import type { BuildingMaterialInfo } from "./types";

const NAMED_COLORS: Record<string, string> = {
  white: "#f2f2f0",
  black: "#2b2b2b",
  grey: "#9a9a9a",
  gray: "#9a9a9a",
  red: "#a94442",
  brown: "#7a5738",
  beige: "#d8cdb8",
  tan: "#d2b48c",
  yellow: "#d9c26a",
  green: "#6b8e63",
  blue: "#5a7a9a",
  cream: "#e5ddc9",
};

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{3,6}$/i.test(value);
}

function resolveExplicitColor(raw?: string): string | null {
  if (!raw) return null;

  const value = raw.trim().toLowerCase();
  if (isHexColor(value)) return value;

  return NAMED_COLORS[value] ?? null;
}

function hashToUnit(id: number): number {
  const x = Math.sin(id) * 10000;
  return x - Math.floor(x);
}

function pickVariant(colors: string[], id: number): string {
  const index = Math.floor(hashToUnit(id) * colors.length);
  return colors[Math.min(index, colors.length - 1)];
}

function weather(hex: string, id: number): string {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);

  const jitter = hashToUnit(id * 7.13) - 0.5;
  hsl.l = THREE.MathUtils.clamp(hsl.l + jitter * 0.08, 0, 1);
  hsl.s = THREE.MathUtils.clamp(hsl.s - Math.abs(jitter) * 0.04, 0, 1);

  color.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${color.getHexString()}`;
}

export function resolveBuildingMaterial(
  id: number,
  buildingType: string | undefined,
  facadeMaterial: string | undefined,
  facadeColour: string | undefined,
): BuildingMaterialInfo {
  const explicitColor = resolveExplicitColor(facadeColour);
  const materialKey =
    (facadeMaterial && Config.materialsByType[facadeMaterial]
      ? facadeMaterial
      : undefined) ??
    (buildingType && Config.materialByBuildingType[buildingType]) ??
    Config.defaultMaterial;

  const materialParams = Config.materialsByType[materialKey];
  const color =
    explicitColor ?? weather(pickVariant(materialParams.colors, id), id);
  const source: BuildingMaterialInfo["source"] =
    explicitColor || (facadeMaterial && Config.materialsByType[facadeMaterial])
      ? "osm"
      : "procedural";

  return {
    color,
    roughness: materialParams.roughness,
    metalness: materialParams.metalness,
    source,
  };
}
