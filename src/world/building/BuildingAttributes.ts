import Config from "./config/BuildingConfig";

export interface ParsedAttributes {
  type?: string;
  height: number;
  minHeight: number;
  wikidata?: string;
}

function parseLengthMeters(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = raw.trim();

  const feetInches = value.match(/^(\d+(?:\.\d+)?)'\s*(?:(\d+(?:\.\d+)?)")?$/);
  if (feetInches) {
    const feet = Number.parseFloat(feetInches[1]);
    const inches = feetInches[2] ? Number.parseFloat(feetInches[2]) : 0;
    return feet * 0.3048 + inches * 0.0254;
  }

  const feet = value.match(/^(\d+(?:\.\d+)?)\s*ft$/i);
  if (feet) return Number.parseFloat(feet[1]) * 0.3048;

  const meters = value.match(/^(\d+(?:\.\d+)?)/);
  if (meters) {
    const n = Number.parseFloat(meters[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

function parsePositive(raw: string | undefined): number | null {
  if (!raw) return null;

  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseBuildingAttributes(
  tags: Record<string, string> | undefined,
): ParsedAttributes {
  const t = tags ?? {};

  const explicitHeight = parseLengthMeters(t["height"]);
  const levels = parsePositive(t["building:levels"]);
  const minHeight = parseLengthMeters(t["min_height"]) ?? 0;
  const type = t["building"];

  let totalHeight: number;
  if (explicitHeight !== null) totalHeight = explicitHeight;
  else if (levels !== null)
    totalHeight = levels * Config.metersPerLevel + Config.groundFloorAdjustment;
  else {
    const typeDefault = type ? Config.defaultHeightsByType[type] : undefined;
    totalHeight = typeDefault ?? Config.defaultBuildingHeight;
  }

  return {
    type,
    height: totalHeight,
    minHeight,
    wikidata: t["wikidata"],
  };
}
