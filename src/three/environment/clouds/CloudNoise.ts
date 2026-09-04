import * as THREE from "three";

export default class CloudNoise {
  public static create(size = 64): THREE.Data3DTexture {
    const voxelCount = size * size * size;

    const data = new Uint8Array(voxelCount);

    let index = 0;

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size;
          const ny = y / size;
          const nz = z / size;

          const value = CloudNoise.fbm(nx, ny, nz);

          data[index++] = Math.floor(value * 255);
        }
      }
    }

    const texture = new THREE.Data3DTexture(data, size, size, size);

    texture.format = THREE.RedFormat;
    texture.type = THREE.UnsignedByteType;

    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapR = THREE.RepeatWrapping;

    texture.unpackAlignment = 1;

    texture.needsUpdate = true;

    return texture;
  }

  private static hash(x: number, y: number, z: number): number {
    const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;

    return value - Math.floor(value);
  }

  private static noise(x: number, y: number, z: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);

    const fx = x - ix;
    const fy = y - iy;
    const fz = z - iz;

    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    const uz = fz * fz * (3.0 - 2.0 * fz);

    const n000 = CloudNoise.hash(ix, iy, iz);
    const n100 = CloudNoise.hash(ix + 1, iy, iz);
    const n010 = CloudNoise.hash(ix, iy + 1, iz);
    const n110 = CloudNoise.hash(ix + 1, iy + 1, iz);

    const n001 = CloudNoise.hash(ix, iy, iz + 1);
    const n101 = CloudNoise.hash(ix + 1, iy, iz + 1);
    const n011 = CloudNoise.hash(ix, iy + 1, iz + 1);
    const n111 = CloudNoise.hash(ix + 1, iy + 1, iz + 1);

    const nx00 = THREE.MathUtils.lerp(n000, n100, ux);
    const nx10 = THREE.MathUtils.lerp(n010, n110, ux);
    const nx01 = THREE.MathUtils.lerp(n001, n101, ux);
    const nx11 = THREE.MathUtils.lerp(n011, n111, ux);

    const nxy0 = THREE.MathUtils.lerp(nx00, nx10, uy);
    const nxy1 = THREE.MathUtils.lerp(nx01, nx11, uy);

    return THREE.MathUtils.lerp(nxy0, nxy1, uz);
  }

  private static fbm(x: number, y: number, z: number): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1.0;

    for (let i = 0; i < 5; i++) {
      value +=
        CloudNoise.noise(
          x * frequency * 8.0,
          y * frequency * 8.0,
          z * frequency * 8.0,
        ) * amplitude;

      frequency *= 2.0;
      amplitude *= 0.5;
    }

    return Math.min(1, value);
  }
}
