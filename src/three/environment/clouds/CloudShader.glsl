precision highp float;
precision highp sampler3D;

uniform sampler3D cloudNoise;

uniform vec3 sunDirection;
uniform vec3 cloudCenter;

uniform float cloudBottom;
uniform float cloudTop;

uniform float cloudDensity;
uniform float cloudCoverage;

uniform float baseStrength;
uniform float detailStrength;

uniform float time;
uniform float windSpeed;

uniform float sunIntensity;
uniform float ambientStrength;

uniform float detailDistance;
uniform float extinction;
uniform float noiseScale;
uniform float cameraDistance;

varying vec3 vWorldPosition;

#define PI 3.14159265359

const int MAX_STEPS = 64;
const int LIGHT_STEPS = 4;

const vec3 EXTINCTION_MULT = vec3(0.8, 0.8, 1.0);

const float DUAL_LOBE_WEIGHT = 0.7;

float saturateValue(float x) {
    return clamp(x, 0.0, 1.0);
}

float remap(float value, float oldMin, float oldMax, float newMin, float newMax) {
    return newMin + (value - oldMin) / (oldMax - oldMin) * (newMax - newMin);
}

float HenyeyGreenstein(float g, float mu) {
    float gg = g * g;
    return (1.0 / (4.0 * PI)) * ((1.0 - gg) / pow(1.0 + gg - 2.0 * g * mu, 1.5));
}

float DualHenyeyGreenstein(
    float g,
    float costh
)
{
    return mix(
        HenyeyGreenstein(-g, costh),
        HenyeyGreenstein(g, costh),
        DUAL_LOBE_WEIGHT
    );
}

float PhaseFunction(
    float g,
    float costh
)
{
    return DualHenyeyGreenstein(
        g,
        costh
    );
}

vec2 intersectCloudLayer(
    vec3 ro,
    vec3 rd
)
{
    vec3 boundsMin = vec3(
            cloudCenter.x - 5000.0,
            cloudBottom,
            cloudCenter.z - 5000.0
        );

    vec3 boundsMax = vec3(
            cloudCenter.x + 5000.0,
            cloudTop,
            cloudCenter.z + 5000.0
        );

    vec3 invDir = 1.0 / rd;

    vec3 t0 =
        (boundsMin - ro) *
            invDir;

    vec3 t1 =
        (boundsMax - ro) *
            invDir;

    vec3 tMin =
        min(t0, t1);

    vec3 tMax =
        max(t0, t1);

    float nearT =
        max(
            max(tMin.x, tMin.y),
            tMin.z
        );

    float farT =
        min(
            min(tMax.x, tMax.y),
            tMax.z
        );

    return vec2(
        max(nearT, 0.0),
        farT
    );
}

float sampleCloud(
    vec3 worldPosition
)
{
    vec3 p =
        worldPosition -
            cloudCenter;

    p.x += time * windSpeed;
    p.z += time * windSpeed * 0.35;

    float height =
        saturateValue(
            (worldPosition.y - cloudBottom) /
                (cloudTop - cloudBottom)
        );

    float bottomFade =
        smoothstep(
            0.0,
            0.15,
            height
        );

    float topFade =
        1.0 -
            smoothstep(
                0.65,
                1.0,
                height
            );

    float verticalProfile =
        bottomFade *
            topFade;

    if (verticalProfile <= 0.001)
        return 0.0;

    vec3 baseCoord =
        p * noiseScale;

    float base =
        texture(
            cloudNoise,
            baseCoord
        ).r;

    float medium =
        texture(
            cloudNoise,
            baseCoord * 2.0 +
                vec3(0.17, 0.0, 0.13)
        ).r;

    float detail =
        texture(
            cloudNoise,
            baseCoord * 4.0 +
                vec3(0.31, 0.11, 0.07)
        ).r;

    float shape =
        mix(
            base,
            medium,
            0.35
        );

    float density =
        remap(
            shape,
            cloudCoverage,
            1.0,
            0.0,
            1.0
        );

    density =
        saturateValue(density);

    float detailFactor =
        1.0 -
            smoothstep(
                500.0,
                detailDistance,
                cameraDistance
            );

    density =
        remap(
            density,
            detailStrength *
                detail *
                detailFactor,
            1.0,
            0.0,
            1.0
        );

    density *=
        verticalProfile;

    density *=
        baseStrength;

    return saturateValue(
        density *
            cloudDensity
    );
}

float sampleSunTransmittance(
    vec3 position
)
{
    vec2 layer =
        intersectCloudLayer(
            position,
            sunDirection
        );

    if (layer.y <= 0.0)
        return 1.0;

    float maxDistance =
        min(
            layer.y,
            1200.0
        );

    float stepSize =
        maxDistance /
            float(LIGHT_STEPS);

    float density =
        0.0;

    vec3 p =
        position;

    for (
        int i = 0;
        i < LIGHT_STEPS;
        i++
    )
    {
        p +=
            sunDirection *
                stepSize;

        density +=
            sampleCloud(p) *
                stepSize;

        if (density > 8.0)
            break;
    }

    return exp(
        -density *
            extinction *
            0.035
    );
}

vec3 calculateCloudLighting(
    vec3 position,
    vec3 viewDirection
)
{
    float mu =
        dot(
            viewDirection,
            sunDirection
        );

    float phase =
        PhaseFunction(
            0.35,
            mu
        );

    float sunVisibility =
        sampleSunTransmittance(
            position
        );

    vec3 sun =
        vec3(1.0) *
            sunIntensity *
            phase *
            sunVisibility;

    vec3 ambient =
        vec3(
            0.55,
            0.65,
            0.8
        ) *
            ambientStrength;

    return ambient + sun;
}

vec4 marchClouds(
    vec3 rayOrigin,
    vec3 rayDirection
)
{
    vec2 intersection =
        intersectCloudLayer(
            rayOrigin,
            rayDirection
        );

    if (
        intersection.x >=
            intersection.y
    )
    {
        return vec4(
            0.0,
            0.0,
            0.0,
            0.0
        );
    }

    float nearT =
        intersection.x;

    float farT =
        intersection.y;

    float distance =
        farT - nearT;

    float steps =
        clamp(
            distance / 35.0,
            16.0,
            float(MAX_STEPS)
        );

    float stepSize =
        distance /
            steps;

    float jitter =
        fract(
            sin(
                dot(
                    gl_FragCoord.xy,
                    vec2(
                        12.9898,
                        78.233
                    )
                )
            ) *
                43758.5453 +
                time
        );

    float travel =
        nearT +
            jitter *
                stepSize;

    vec3 scattering =
        vec3(0.0);

    float transmittance =
        1.0;

    for (
        int i = 0;
        i < MAX_STEPS;
        i++
    )
    {
        if (
            float(i) >= steps
        )
            break;

        if (
            travel >= farT
        )
            break;

        vec3 position =
            rayOrigin +
                rayDirection *
                    travel;

        float density =
            sampleCloud(
                position
            );

        if (
            density > 0.001
        )
        {
            vec3 lighting =
                calculateCloudLighting(
                    position,
                    rayDirection
                );

            float opticalDepth =
                density *
                    extinction *
                    stepSize *
                    0.025;

            float localTransmittance =
                exp(
                    -opticalDepth
                );

            vec3 contribution =
                lighting *
                    density *
                    stepSize *
                    0.025;

            scattering +=
                transmittance *
                    contribution;

            transmittance *=
                localTransmittance;

            if (
                transmittance <
                    0.015
            )
            {
                transmittance = 0.0;
                break;
            }
        }

        travel +=
            stepSize;
    }

    return vec4(
        scattering,
        1.0 - transmittance
    );
}

void main()
{
    vec3 rayOrigin =
        cameraPosition;

    vec3 rayDirection =
        normalize(
            vWorldPosition -
                cameraPosition
        );

    float distanceToCamera =
        distance(
            cameraPosition,
            vWorldPosition
        );

    vec4 cloud = marchClouds(rayOrigin, rayDirection);
    gl_FragColor = vec4(cloud.rgb, cloud.a);
}
