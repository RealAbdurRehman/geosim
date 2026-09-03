import Config from "./config/BuildingConfig";
import type { BuildingAttributes, RoofShape } from "./types";

const VALID_ROOF_SHAPES: RoofShape[] = [
  "dome",
  "flat",
  "gabled",
  "gambrel",
  "hipped",
  "mansard",
  "onion",
  "pyramidal",
  "round",
  "skillion",
];

function parseRoofShape(value?: string): RoofShape {
  return value && (VALID_ROOF_SHAPES as string[]).includes(value)
    ? (value as RoofShape)
    : "flat";
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

function estimateRoofHeight(
  explicit: number | null,
  levels: number | null,
  shape: RoofShape,
): number {
  if (explicit !== null) return explicit;
  if (levels !== null) return levels * Config.metersPerRoofLevel;
  return shape === "flat" ? 0 : Config.defaultRoofHeight;
}

export function parseBuildingAttributes(
  tags: Record<string, string> | undefined,
): BuildingAttributes {
  const t = tags ?? {};

  const roofShape = parseRoofShape(t["roof:shape"]);
  const roofLevels = parsePositive(t["roof:levels"]);
  const roofHeight = estimateRoofHeight(
    parseLengthMeters(t["roof:height"]),
    roofLevels,
    roofShape,
  );

  const explicitHeight = parseLengthMeters(t["height"]);
  const levels = parsePositive(t["building:levels"]);
  const minHeight = parseLengthMeters(t["min_height"]) ?? 0;

  let totalHeight: number;
  if (explicitHeight !== null) {
    totalHeight = explicitHeight;
  } else if (levels !== null) {
    totalHeight =
      levels * Config.metersPerLevel +
      Config.groundFloorAdjustment +
      roofHeight;
  } else {
    const type = t["building"];
    const typeDefault = type ? Config.defaultHeightsByType[type] : undefined;
    totalHeight = typeDefault ?? Config.defaultBuildingHeight;
  }

  return {
    general: {
      type: t["building"],
      use: t["building:use"],
      name: t["name"],
      altName: t["alt_name"],
      officialName: t["official_name"],
      description: t["description"],
      operator: t["operator"],
      owner: t["owner"],
      brand: t["brand"],
      ref: t["ref"],
    },
    dimensions: {
      totalHeight,
      minHeight,
      levels: levels ?? 0,
      minLevel: parsePositive(t["building:min_level"]) ?? undefined,
      undergroundLevels:
        parsePositive(t["building:levels:underground"]) ?? undefined,
    },
    roof: {
      shape: roofShape,
      height: roofHeight,
      levels: roofLevels ?? undefined,
      angle: parsePositive(t["roof:angle"]) ?? undefined,
      direction: t["roof:direction"],
      orientation: t["roof:orientation"],
      material: t["roof:material"],
      colour: t["roof:colour"],
    },
    facade: {
      material: t["building:material"],
      colour: t["building:colour"],
      walls: t["building:walls"],
      structure: t["building:structure"],
    },
    address: {
      housenumber: t["addr:housenumber"],
      street: t["addr:street"],
      unit: t["addr:unit"],
      postcode: t["addr:postcode"],
      city: t["addr:city"],
      district: t["addr:district"],
      state: t["addr:state"],
      country: t["addr:country"],
    },
    metadata: {
      website: t["website"],
      phone: t["phone"],
      wikidata: t["wikidata"],
      wikipedia: t["wikipedia"],
      source: t["source"],
    },
  };
}
