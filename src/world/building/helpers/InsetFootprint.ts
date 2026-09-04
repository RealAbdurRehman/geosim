import type { LocalPoint } from "../../../geo/types";

function centroid(points: LocalPoint[]): LocalPoint {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), {
    x: 0,
    z: 0,
  });

  return { x: sum.x / points.length, z: sum.z / points.length };
}

export function insetFootprint(
  footprint: LocalPoint[],
  amount: number,
): LocalPoint[] {
  const c = centroid(footprint);
  return footprint.map((p) => {
    const dx = c.x - p.x;
    const dz = c.z - p.z;

    const dist = Math.hypot(dx, dz);
    if (dist === 0) return p;

    const t = amount / dist;
    return { x: p.x + dx * t, z: p.z + dz * t };
  });
}
