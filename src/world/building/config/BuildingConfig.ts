const Config = {
  metersPerLevel: 3,
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
    garage: 3,
    garages: 3,
    shed: 3,
    hut: 3,
    cabin: 4,
    roof: 4,
  } as Record<string, number>,
};

export default Config;
