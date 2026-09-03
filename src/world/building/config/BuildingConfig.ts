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
};

export default Config;
