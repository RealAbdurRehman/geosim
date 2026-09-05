export function createSeededRandom(seed: number): () => number {
  return () => {
    seed += 0x6d2b79f5;

    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class ImprovedNoise {
  private readonly p: Uint8Array;
  constructor(seededRandom: () => number = Math.random) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    this.p = new Uint8Array(512);
    for (let i = 0; i < 256; i++) this.p[i] = this.p[i + 256] = p[i];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number, z: number): number {
    const p = this.p;
    const xi = Math.floor(x) & 255,
      yi = Math.floor(y) & 255,
      zi = Math.floor(z) & 255;
    const xf = x - Math.floor(x),
      yf = y - Math.floor(y),
      zf = z - Math.floor(z);
    const u = this.fade(xf),
      v = this.fade(yf),
      w = this.fade(zf);

    const aaa = p[p[p[xi] + yi] + zi],
      aab = p[p[p[xi] + yi] + zi + 1];
    const aba = p[p[p[xi] + yi + 1] + zi],
      abb = p[p[p[xi] + yi + 1] + zi + 1];
    const baa = p[p[p[xi + 1] + yi] + zi],
      bab = p[p[p[xi + 1] + yi] + zi + 1];
    const bba = p[p[p[xi + 1] + yi + 1] + zi],
      bbb = p[p[p[xi + 1] + yi + 1] + zi + 1];

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(p[aaa], xf, yf, zf),
          this.grad(p[baa], xf - 1, yf, zf),
        ),
        this.lerp(
          u,
          this.grad(p[aba], xf, yf - 1, zf),
          this.grad(p[bba], xf - 1, yf - 1, zf),
        ),
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(p[aab], xf, yf, zf - 1),
          this.grad(p[bab], xf - 1, yf, zf - 1),
        ),
        this.lerp(
          u,
          this.grad(p[abb], xf, yf - 1, zf - 1),
          this.grad(p[bbb], xf - 1, yf - 1, zf - 1),
        ),
      ),
    );
  }
}

export function fbm(
  perlin: ImprovedNoise,
  x: number,
  y: number,
  z: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
): number {
  let total = 0,
    frequency = 1,
    amplitude = 1,
    maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total +=
      perlin.noise(x * frequency, y * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}
