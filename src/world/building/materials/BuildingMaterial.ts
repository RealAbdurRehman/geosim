import * as THREE from "three";

const vertexShader = /* glsl */ `
  attribute float aHeight;
  attribute float aFacadeStyle;

  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uAmbientColor;
  uniform float uGradientStrength;

  varying vec3 vColor;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying float vHeight;
  varying float vFacadeStyle;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vec3 worldNormal = normalize(mat3(modelMatrix) * normal);

    float diffuse = max(dot(worldNormal, uSunDirection), 0.0) / 1.4;
    vec3 litColor = color * (uAmbientColor + uSunColor * diffuse);

    float startOffset = 2.5;
    float normY = clamp(
      (position.y - startOffset) / max(aHeight - startOffset, 1.0),
      0.0,
      1.0
    );

    float falloff = pow(1.0 - normY, 2.0);
    float verticalShading = uGradientStrength * falloff;

    vColor = max(litColor - vec3(verticalShading), vec3(0.05));
    vWorldNormal = worldNormal;
    vWorldPos = worldPos.xyz;
    vHeight = aHeight;
    vFacadeStyle = aFacadeStyle;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying float vHeight;
  varying float vFacadeStyle;

  void main() {
    vec3 baseColor = vColor;
    bool isWall = abs(vWorldNormal.y) < 0.5;

    if (isWall && vFacadeStyle > 0.5 && vWorldPos.y > 2.0) {
      float u = (abs(vWorldNormal.x) > abs(vWorldNormal.z))
        ? vWorldPos.z
        : vWorldPos.x;
      float v = vWorldPos.y;

      float px = max(fwidth(u), fwidth(v));
      float fade = smoothstep(0.04, 0.12, px);

      if (fade > 0.01 && v < vHeight - 1.0) {
        if (vFacadeStyle < 1.5) {
          vec2 cell = vec2(mod(u, 3.5), mod(v - 2.0, 3.0));
          if (cell.x < 2.0 && cell.y < 1.6) {
            baseColor *= 0.75;
          }
        } else if (vFacadeStyle < 2.5) {
          float stripe = mod(u, 2.2);
          if (stripe < 1.3) {
            baseColor *= 0.75;
          }
        } else {
          float band = mod(v - 2.0, 3.5);
          if (band < 1.5) {
            baseColor *= 0.75;
          }
        }

        baseColor = mix(vColor, baseColor, fade);
      }
    }

    gl_FragColor = vec4(baseColor, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export interface OsmBuildingsMaterialOptions {
  sunDirection?: THREE.Vector3;
  sunColor?: THREE.Color;
  ambientColor?: THREE.Color;
  gradientStrength?: number;
  polygonOffset?: { factor: number; units: number };
}

export function createOsmBuildingsMaterial(
  options: OsmBuildingsMaterialOptions = {},
): THREE.ShaderMaterial {
  const sunDirection = (
    options.sunDirection ?? new THREE.Vector3(0.55, 0.75, 0.4)
  ).normalize();
  const sunColor = options.sunColor ?? new THREE.Color(1.0, 0.96, 0.9);

  const ambientColor =
    options.ambientColor ?? new THREE.Color(0.55, 0.54, 0.52);
  const gradientStrength = options.gradientStrength ?? 0.48;

  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.lights,
    {
      uSunDirection: { value: sunDirection },
      uSunColor: { value: sunColor },
      uAmbientColor: { value: ambientColor },
      uGradientStrength: { value: gradientStrength },
    },
  ]);

  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    vertexColors: true,
    lights: true,
    uniforms,
    polygonOffset: !!options.polygonOffset,
    polygonOffsetFactor: options.polygonOffset?.factor ?? 0,
    polygonOffsetUnits: options.polygonOffset?.units ?? 0,
  });
}
