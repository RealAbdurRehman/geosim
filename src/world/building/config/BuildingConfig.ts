import type { BuildingFeatureCategory } from "../types";

const Config = {
  metersPerLevel: 3,
  metersPerRoofLevel: 2.5,
  defaultRoofHeight: 3,
  defaultBuildingHeight: 10,
  groundFloorAdjustment: 1.5,
  defaultHeightsByType: {
    house: 8,
    detached: 8,
    semidetached_house: 8,
    terrace: 10,
    residential: 15,
    apartments: 22,
    commercial: 15,
    retail: 6,
    office: 25,
    industrial: 8,
    warehouse: 8,
    skyscraper: 150,
  } as Record<string, number>,
  maxFeatureAttachDistance: {
    window: 5,
    balcony: 5,
    entrance: 5,
    parking: 25,
    garage: 0,
  } as Record<BuildingFeatureCategory, number>,
  defaultMaterial: "concrete" as string,
  materialByBuildingType: {
    house: "brick",
    detached: "brick",
    semidetached_house: "brick",
    terrace: "brick",
    residential: "plaster",
    apartments: "concrete",
    commercial: "glass",
    retail: "glass",
    office: "glass",
    industrial: "metal",
    warehouse: "metal",
    skyscraper: "glass",
  } as Record<string, string>,
  materialsByType: {
    brick: {
      roughness: 0.85,
      metalness: 0.0,
      colors: ["#a68a75", "#9c8068", "#ab9280"],
    },
    concrete: {
      roughness: 0.9,
      metalness: 0.0,
      colors: ["#b0aca3", "#a5a099", "#bab6ad"],
    },
    glass: {
      roughness: 0.15,
      metalness: 0.3,
      colors: ["#aebcc4", "#a3b3bc", "#b8c4cb"],
    },
    wood: {
      roughness: 0.75,
      metalness: 0.0,
      colors: ["#9c8468", "#93795d", "#a58e72"],
    },
    stone: {
      roughness: 0.8,
      metalness: 0.0,
      colors: ["#a8a396", "#9d988a", "#b0aba0"],
    },
    plaster: {
      roughness: 0.7,
      metalness: 0.0,
      colors: ["#d2ccbf", "#c9c3b5", "#dad4c8"],
    },
    metal: {
      roughness: 0.4,
      metalness: 0.5,
      colors: ["#a8a8a5", "#9d9d9a", "#b3b3b0"],
    },
    stucco: {
      roughness: 0.7,
      metalness: 0.0,
      colors: ["#d5cebc", "#cbc4b1", "#ddd6c4"],
    },
    cement_block: {
      roughness: 0.85,
      metalness: 0.0,
      colors: ["#aba69c", "#a19c92", "#b5b0a6"],
    },
  } as Record<
    string,
    { roughness: number; metalness: number; colors: string[] }
  >,
};

export default Config;
