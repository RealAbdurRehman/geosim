precision highp float;
precision highp sampler3D;
in vec3 vOrigin;
in vec3 vDirection;
out vec4 color;

uniform highp sampler3D uVolumeTexture;
uniform sampler2D uBlueNoise;
uniform vec2 uBlueNoiseSize;
uniform vec2 uResolution;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform vec3 uLightDir;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
uniform vec3 uCloudColor;
uniform float uOpacity;
uniform int uMaxSteps;
uniform int uLightSteps;
uniform float uDensityThreshold;
uniform float uDensityMultiplier;
uniform vec3 uTextureOffset;
uniform float uTextureTiling;
uniform float u_mask_raio;
uniform float u_mask_achatamentoCima;
uniform float u_mask_achatamentoBaixo;
uniform float u_mask_achatamentoXpos;
uniform float u_mask_achatamentoXneg;
uniform float u_mask_achatamentoZpos;
uniform float u_mask_achatamentoZneg;
uniform float u_mask_softness;
uniform float u_mask_forcaRuido;
uniform highp sampler3D u_mask_noiseMap;
uniform float u_mask_forcaRuidoDetalhe;
uniform highp sampler3D u_mask_noiseDetailMap;
uniform bool u_mask_visualize;

uniform sampler2D uDepthTexture;
uniform mat4 uModelViewMatrix;
uniform float uCameraNear;
uniform float uCameraFar;
uniform bool uIsLogDepth;

#define PI 3.14159265359
const vec3 EXTINCTION_MULT = vec3(0.55, 0.6, 0.65);
const float DUAL_LOBE_WEIGHT = 0.75;

float getLinearDepth(float d) {
    if (d >= 1.0) return uCameraFar;
    if (uIsLogDepth) return pow(uCameraFar + 1.0, d) - 1.0;
    return (uCameraNear * uCameraFar) / (uCameraFar + d * (uCameraNear - uCameraFar));
}

float getMaskSDF(vec3 p) {
    if (u_mask_raio <= 0.0) return -1.0;

    vec3 pd = p;
    pd.y /= (p.y > 0.0) ? u_mask_achatamentoCima : u_mask_achatamentoBaixo;
    pd.x /= (p.x > 0.0) ? u_mask_achatamentoXpos : u_mask_achatamentoXneg;
    pd.z /= (p.z > 0.0) ? u_mask_achatamentoZpos : u_mask_achatamentoZneg;
    float dist = length(pd);
    if (dist == 0.0) return u_mask_raio;

    float maxRadius = u_mask_raio + u_mask_forcaRuido + u_mask_forcaRuidoDetalhe + u_mask_softness;
    if (dist > maxRadius) return -1.0;

    vec3 dir = pd / dist;
    vec3 tc = (dir * u_mask_raio) * 0.5 + 0.5;
    float nPrincipal = texture(u_mask_noiseMap, tc).r * 2.0 - 1.0;
    float nDetail = texture(u_mask_noiseDetailMap, tc).r * 2.0 - 1.0;
    float totalDisp = (nPrincipal * u_mask_forcaRuido) + (nDetail * u_mask_forcaRuidoDetalhe);
    return (u_mask_raio + totalDisp) - dist;
}

float getMaskFactor(vec3 p) {
    return smoothstep(0.0, u_mask_softness, getMaskSDF(p));
}

float HenyeyGreenstein(float g, float mu) {
    float gg = g * g;
    return (1.0 / (4.0 * PI)) * ((1.0 - gg) / pow(1.0 + gg - 2.0 * g * mu, 1.5));
}

float PhaseFunction(float g, float costh) {
    return mix(HenyeyGreenstein(-g, costh), HenyeyGreenstein(g, costh), DUAL_LOBE_WEIGHT);
}

vec2 hitBox(vec3 orig, vec3 dir) {
    const vec3 bmin = vec3(-0.5);
    const vec3 bmax = vec3(0.5);

    vec3 inv = 1.0 / dir;
    vec3 t0 = (bmin - orig) * inv;
    vec3 t1 = (bmax - orig) * inv;
    vec3 tn = min(t0, t1);
    vec3 tx = max(t0, t1);
    return vec2(max(tn.x, max(tn.y, tn.z)), min(tx.x, min(tx.y, tx.z)));
}

float getDensity(vec3 p) {
    float mask = getMaskFactor(p);
    if (mask <= 0.0) return 0.0;
    if (u_mask_visualize) return 1.0 * uDensityMultiplier * mask;

    vec3 tc = (p + 0.5) * uTextureTiling + uTextureOffset;
    float d = texture(uVolumeTexture, tc).r;
    if (d < uDensityThreshold) return 0.0;

    return d * uDensityMultiplier * mask;
}

float CalculateLightEnergy(vec3 p, vec3 ldir) {
    if (uLightSteps <= 0) return 1.0;

    float step = 1.0 / float(uLightSteps);
    float ldens = 0.0;
    for (int i = 0; i < uLightSteps; i++) {
        vec3 sp = p + ldir * (float(i) + 0.5) * step;
        if (all(greaterThan(sp, vec3(-0.5))) && all(lessThan(sp, vec3(0.5))))
            ldens += getDensity(sp) * step;
    }

    float primary = exp(-ldens * 0.8);
    float secondary = exp(-ldens * 0.2) * 0.4;
    return clamp(primary + secondary, 0.0, 1.0);
}

void main() {
    vec3 rayDir = normalize(vDirection);
    vec2 bounds = hitBox(vOrigin, rayDir);
    if (bounds.x >= bounds.y) discard;

    bounds.x = max(bounds.x, 0.0);
    float rayLen = bounds.y - bounds.x;
    if (rayLen < 0.001) discard;

    vec2 screenUV = gl_FragCoord.xy / uResolution;
    float sceneDepthVal = texture(uDepthTexture, screenUV).r;
    float sceneDepthZ = getLinearDepth(sceneDepthVal);

    float stepSize = rayLen / float(uMaxSteps);
    float jitter = texture(uBlueNoise, mod(gl_FragCoord.xy, uBlueNoiseSize) / uBlueNoiseSize).r;
    vec3 p = vOrigin + (bounds.x + jitter * stepSize) * rayDir;

    vec3 accColor = vec3(0.0);
    vec3 transmittance = vec3(1.0);
    float mu = dot(rayDir, uLightDir);
    float phase = PhaseFunction(0.35, mu);
    float fadeZone = stepSize * 2.5;

    for (int i = 0; i < uMaxSteps; i++) {
        vec4 viewPos = uModelViewMatrix * vec4(p, 1.0);
        if (-viewPos.z > sceneDepthZ) break;

        float distRem = rayLen - ((float(i) + jitter) * stepSize);
        if (distRem < 0.0) break;

        float density = getDensity(p);
        if (density > 0.01) {
            float lightE = CalculateLightEnergy(p, uLightDir);
            vec3 sunL = uSunColor * uSunIntensity * lightE * (phase * 2.2 + 0.4);
            vec3 ambL = uAmbientColor * uAmbientIntensity;
            vec3 totalLight = (sunL + ambL) * uCloudColor;
            float powder = 1.0 - exp(-density * stepSize * 2.0);
            vec3 scatt = totalLight * density * stepSize * powder * smoothstep(0.0, fadeZone, distRem);
            vec3 stepTrans = exp(-density * stepSize * EXTINCTION_MULT * uOpacity);
            accColor += transmittance * scatt;

            transmittance *= stepTrans;
            if (length(transmittance) < 0.01) break;
        }

        p += rayDir * stepSize;
    }

    color = vec4(accColor, 1.0 - transmittance.r);
}
