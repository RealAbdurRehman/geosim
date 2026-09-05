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
      colors: ["#b85f3c", "#a94f32", "#c66c45", "#9e472e"],
    },
    concrete: {
      roughness: 0.9,
      metalness: 0.0,
      colors: ["#bcb8b0", "#aaa69f", "#c9c5bd", "#9f9b94"],
    },
    glass: {
      roughness: 0.12,
      metalness: 0.05,
      colors: ["#6fa9bd", "#5795ad", "#82bdcd", "#4f8ca5"],
    },
    wood: {
      roughness: 0.75,
      metalness: 0.0,
      colors: ["#a9784f", "#95663f", "#bd8b5c", "#855735"],
    },
    stone: {
      roughness: 0.8,
      metalness: 0.0,
      colors: ["#aaa69d", "#99958c", "#bbb7ad", "#8f8b82"],
    },
    plaster: {
      roughness: 0.7,
      metalness: 0.0,
      colors: ["#e0d4bd", "#d5c7ad", "#e8ddc9", "#c9baa0"],
    },
    metal: {
      roughness: 0.35,
      metalness: 0.6,
      colors: ["#858d91", "#70797e", "#9ca4a7", "#626b70"],
    },
    stucco: {
      roughness: 0.7,
      metalness: 0.0,
      colors: ["#ded2b8", "#d2c4a7", "#e7dcc5", "#c7b99c"],
    },
    cement_block: {
      roughness: 0.85,
      metalness: 0.0,
      colors: ["#b5b0a6", "#a6a198", "#c2bdb3", "#99948b"],
    },
  } as Record<
    string,
    { roughness: number; metalness: number; colors: string[] }
  >,
  facadeTexture: {
    size: 512,
    brick: {
      rows: 16,
      cols: 8,
      mortarSize: 3,
      mortarRoughness: 1.0,
      colorVariation: 0.15,
      roughness: { min: 180, max: 230 },
      tileScale: [10, 10] as [number, number],
      mortarColor: "#a89f91",
    },
    concrete: {
      colorNoise: 25,
      roughness: { base: 200, noise: 40 },
      tileScale: [8.0, 8.0] as [number, number],
      formworkSeam: {
        enabled: true,
        color: "rgba(0,0,0,0.15)",
        width: 2,
        position: 0.5,
      },
    },
    glass: {
      mullions: {
        color: "#1b1e22",
        roughnessColor: "#ffffff",
        width: 12,
        divisions: 4,
      },
      roughnessColor: "#666666",
      tileScale: [20.0, 20.0] as [number, number],
    },
    plaster: {
      colorNoise: 10,
      roughness: { base: 160, noise: 30 },
      tileScale: [8.0, 8.0] as [number, number],
    },
  },
};

export default Config;
