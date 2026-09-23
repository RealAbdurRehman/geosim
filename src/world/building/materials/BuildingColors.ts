export const MATERIAL_COLORS: Record<string, string> = {
  brick: "#cc7755",
  bronze: "#ffeecc",
  canvas: "#fff8f0",
  concrete: "#dedede",
  copper: "#a0e0d0",
  glass: "#a8c4cc",
  gold: "#ffcc00",
  plants: "#4a8a55",
  metal: "#b0b8c0",
  panel: "#fff8f0",
  plaster: "#dedad2",
  roof_tiles: "#f08060",
  silver: "#cccccc",
  slate: "#5c6268",
  stone: "#dcd6cd",
  tar_paper: "#383c40",
  wood: "#deb887",
};

const BASE_MATERIALS: Record<string, string> = {
  asphalt: "tar_paper",
  bitumen: "tar_paper",
  block: "stone",
  bricks: "brick",
  glas: "glass",
  glassfront: "glass",
  grass: "plants",
  masonry: "stone",
  granite: "stone",
  panels: "panel",
  paving_stones: "stone",
  plastered: "plaster",
  rooftiles: "roof_tiles",
  roofingfelt: "tar_paper",
  sandstone: "stone",
  sheet: "canvas",
  sheets: "canvas",
  shingle: "tar_paper",
  shingles: "tar_paper",
  slates: "slate",
  steel: "metal",
  tar: "tar_paper",
  tent: "canvas",
  thatch: "plants",
  tile: "roof_tiles",
  tiles: "roof_tiles",
};

export const DEFAULT_WALL_COLOR = "#dcd2c8";
export const DEFAULT_ROOF_COLOR = "#7a8288";

const TYPE_PALETTES: Record<string, string[]> = {
  office: ["#9cb8c5", "#dcd5cc", "#8ea4b0", "#363a40", "#cfc8be"],
  commercial: ["#dcd2c8", "#cfc5ba", "#98b0be", "#d8d0c5"],
  apartments: ["#e4ded5", "#d8cfc4", "#cebaa8", "#d0c8bf"],
  residential: ["#e8e2d8", "#dfd7cc", "#cfc3b4", "#bfae9e"],
  retail: ["#dfdcd5", "#d2cbc0", "#9bb2c0"],
  industrial: ["#b8b5af", "#a8a5a0", "#c2beb8"],
};

const FALLBACK_PALETTE = [
  "#dcd2c8",
  "#e3ddd4",
  "#d4ccc0",
  "#cfc5b8",
  "#c8bfb0",
  "#9db5c2",
  "#b0c5d0",
  "#4a4e54",
];

function hash(id: number): number {
  const x = Math.sin(id * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function resolveMaterialColor(materialName?: string): string | null {
  if (!materialName) return null;
  const key = materialName.toLowerCase().trim();
  if (key.startsWith("#")) return key;
  const canonical = BASE_MATERIALS[key] ?? key;
  return MATERIAL_COLORS[canonical] ?? null;
}

export function resolveWallColor(
  id: number,
  tags?: Record<string, string>,
  type?: string,
): string {
  if (tags?.["building:colour"]) return tags["building:colour"];
  if (tags?.["colour"]) return tags["colour"];

  const mat = tags?.["building:material"] ?? tags?.["material"];
  const matColor = resolveMaterialColor(mat);
  if (matColor) return matColor;

  const palette = (type && TYPE_PALETTES[type]) || FALLBACK_PALETTE;
  const idx = Math.floor(hash(id) * palette.length);
  return palette[Math.min(idx, palette.length - 1)];
}

export function resolveRoofColor(
  id: number,
  tags?: Record<string, string>,
): string {
  if (tags?.["roof:colour"]) return tags["roof:colour"];
  const roofMat = tags?.["roof:material"];
  const matColor = resolveMaterialColor(roofMat);
  if (matColor) return matColor;

  const h = hash(id + 777);
  if (h > 0.7) return "#585e64";
  if (h > 0.4) return "#828990";
  return "#6a7178";
}
