import { type BoundingBox } from "./geo/types";
import { getBuildings } from "./geo/OSMClient";

const testArea: BoundingBox = {
  north: 33.687,
  south: 33.684,
  east: 73.05,
  west: 73.046,
};

const northEl = document.getElementById("north")!;
const southEl = document.getElementById("south")!;
const eastEl = document.getElementById("east")!;
const westEl = document.getElementById("west")!;

const dataEl = document.getElementById("data")!;

async function main() {
  northEl.textContent = String(testArea.north);
  southEl.textContent = String(testArea.south);
  eastEl.textContent = String(testArea.east);
  westEl.textContent = String(testArea.west);

  try {
    const data = await getBuildings(testArea);

    let html = ``;
    for (const building of data.elements)
      html += `<div>
        ID: <span>${building.id}</span> <br />
        Tags: <span>${JSON.stringify(building.tags, null, 2)}</span> <br />
        Geometry: <span>${JSON.stringify(building.geometry, null, 2)}</span> <br />
      </div>
      <hr />
      `;

    dataEl.innerHTML = html;
  } catch (err) {
    console.error("Failed to load building data:", err);
    dataEl.textContent = "Failed to load building data.";
  }
}

main();
