import type { BuildingFeatureCategory, WindowStyleConfig } from "../types";

const Config = {
  metersPerLevel: 3,
  metersPerRoofLevel: 2.5,
  defaultRoofHeight: 3,
  defaultBuildingHeight: 10,
  groundFloorAdjustment: 1.5,
  noWindowBuildingTypes: [
    "garage",
    "garages",
    "carport",
    "shed",
    "greenhouse",
    "hut",
    "cabin",
    "roof",
    "canopy",
    "ruins",
    "digester",
    "silo",
    "hangar",
    "service",
    "elevator",
    "column",
  ] as string[],
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
  minFacadeDimensions: {
    minHeight: 10.0,
    minFootprintArea: 6.0,
    minFootprintDimension: 7.0,
  },
  facadeTexture: {
    size: 256,
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
      moduleWidth: 5.2,
      moduleHeight: 6,
      atlasCols: 4,
      atlasRows: 4,
      frame: {
        color: "#1b1e22",
        thickness: 0.07,
      },
      spandrel: {
        color: "#2b3238",
        heightFraction: 0.1,
      },
      pane: {
        roughness: { min: 0.05, max: 0.35 },
        tintVariation: 0.12,
        reflectionStreakChance: 0.4,
      },
      roughnessColor: "#666666",
    },
    plaster: {
      colorNoise: 10,
      roughness: { base: 160, noise: 30 },
      tileScale: [8.0, 8.0] as [number, number],
    },
    window: {
      styles: {
        residential: {
          moduleWidth: 8.4,
          moduleHeight: 8,
          density: 0.7,
          frame: { color: "#3a332a", thickness: 0.1 },
          sill: { color: "#c9c3b6", heightFraction: 0.08 },
          pane: {
            color: "#41576b",
            roughness: { min: 0.1, max: 0.3 },
            tintVariation: 0.1,
          },
        },
        commercial: {
          moduleWidth: 8.0,
          moduleHeight: 8.2,
          density: 0.95,
          frame: { color: "#20242a", thickness: 0.06 },
          sill: { color: "#2b2f35", heightFraction: 0.04 },
          pane: {
            color: "#4f8ca5",
            roughness: { min: 0.05, max: 0.2 },
            tintVariation: 0.08,
          },
        },
        industrial: {
          moduleWidth: 8.6,
          moduleHeight: 8.2,
          density: 0.35,
          frame: { color: "#2a2d2f", thickness: 0.12 },
          sill: { color: "#41454a", heightFraction: 0.05 },
          pane: {
            color: "#6b7a80",
            roughness: { min: 0.2, max: 0.4 },
            tintVariation: 0.05,
          },
        },
        blank: {
          moduleWidth: 8.0,
          moduleHeight: 8.0,
          density: 0,
          frame: { color: "#000000", thickness: 0 },
          sill: { color: "#000000", heightFraction: 0 },
          pane: {
            color: "#000000",
            tintVariation: 0,
            roughness: { min: 0, max: 0 },
          },
        },
      } as Record<string, WindowStyleConfig>,
      buildingTypeToStyle: {
        house: "residential",
        detached: "residential",
        semidetached_house: "residential",
        terrace: "residential",
        residential: "residential",
        apartments: "residential",
        commercial: "commercial",
        retail: "commercial",
        office: "commercial",
        skyscraper: "commercial",
        industrial: "industrial",
        warehouse: "industrial",
      } as Record<string, string>,
      defaultStyle: "residential" as string,
    },
  },
  roof: {
    parapet: {
      height: 0.6,
      thickness: 0.25,
    },
    domeRings: 4,
    mansardTierRatio: 0.55,
    mansardInsetRatio: 0.55,
    defaultPitchHeight: 3,
    minRoofHeight: 1.5,
    maxRoofHeight: 12,
    skyscraper: {
      flatThreshold: 60,
      parapetChance: 0.65,
      rooftopStructureChance: 0.75,
      maxStructures: 3,
      minStructureHeight: 2.5,
      maxStructureHeight: 8,
    },
    materialByRoofMaterial: {
      tiles: {
        color: "#8a4a35",
        roughness: 0.8,
        metalness: 0,
      },
      slate: {
        color: "#3f4650",
        roughness: 0.6,
        metalness: 0.05,
      },
      metal: {
        color: "#7d868b",
        roughness: 0.35,
        metalness: 0.5,
      },
      copper: {
        color: "#5f8a78",
        roughness: 0.5,
        metalness: 0.2,
      },
      glass: {
        color: "#5f8ca5",
        roughness: 0.1,
        metalness: 0.05,
      },
      concrete: {
        color: "#a9a59d",
        roughness: 0.85,
        metalness: 0,
      },
      gravel: {
        color: "#8f8a7e",
        roughness: 0.95,
        metalness: 0,
      },
      tar_paper: {
        color: "#2c2c2c",
        roughness: 0.9,
        metalness: 0,
      },
    } as Record<
      string,
      {
        color: string;
        roughness: number;
        metalness: number;
      }
    >,
    defaultRoofMaterialByBuildingMaterial: {
      brick: "tiles",
      concrete: "concrete",
      glass: "glass",
      wood: "tiles",
      stone: "slate",
      plaster: "tiles",
      metal: "metal",
      stucco: "tiles",
      cement_block: "gravel",
    } as Record<string, string>,

    defaultRoofMaterial: "gravel",
  },
};

export default Config;
