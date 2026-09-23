import * as THREE from "three";

export function createGroundPlane(): THREE.Mesh {
  const size = 3000;
  const geometry = new THREE.PlaneGeometry(size, size);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color("#e2ded7"),
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -0.1;
  mesh.receiveShadow = true;

  return mesh;
}
