import * as THREE from "three";

const glassMaterials = new Set<THREE.MeshStandardMaterial>();
const baseIntensityByMaterial = new WeakMap<
  THREE.MeshStandardMaterial,
  number
>();

export function registerGlassMaterial(
  material: THREE.MeshStandardMaterial,
  baseIntensity = 1.6,
): void {
  glassMaterials.add(material);
  baseIntensityByMaterial.set(material, baseIntensity);
  material.emissiveIntensity = 0;
}

export function setNightFactor(factor: number): void {
  const clamped = THREE.MathUtils.clamp(factor, 0, 1);
  for (const material of glassMaterials) {
    const base = baseIntensityByMaterial.get(material) ?? 1.6;
    material.emissiveIntensity = base * clamped;
  }
}
