import * as THREE from "three";

import Config from "../config/BuildingConfig";
import type { FacadeTextureType } from "../types";

interface MaterialPBRMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  emissiveMap?: THREE.CanvasTexture;
  bumpMap?: THREE.CanvasTexture;
  tileScale: [number, number];
}

const textureCache = new Map<string, MaterialPBRMaps>();

function createBrickTextures(baseColorHex: string): MaterialPBRMaps {
  const config = Config.facadeTexture.brick;
  const size = Config.facadeTexture.size;

  const colorCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = size;
  roughCanvas.width = roughCanvas.height = size;

  const ctx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex);

  const rows = config.rows;
  const cols = config.cols;

  const rowHeight = size / rows;
  const colWidth = size / cols;

  const mortarSize = config.mortarSize;

  ctx.fillStyle = config.mortarColor;
  ctx.fillRect(0, 0, size, size);

  roughCtx.fillStyle =
    `rgb(${config.mortarRoughness * 255},` +
    `${config.mortarRoughness * 255},` +
    `${config.mortarRoughness * 255})`;
  roughCtx.fillRect(0, 0, size, size);

  for (let r = 0; r < rows; r++) {
    const isOdd = r % 2 === 1;
    const xOffset = isOdd ? colWidth / 2 : 0;
    for (let c = -1; c <= cols; c++) {
      const x = c * colWidth + xOffset + mortarSize;
      const y = r * rowHeight + mortarSize;

      const w = colWidth - mortarSize * 2;
      const h = rowHeight - mortarSize * 2;

      const shade = (Math.random() - 0.5) * config.colorVariation;
      const brickColor = base.clone().offsetHSL(0, 0, shade);
      ctx.fillStyle = `#${brickColor.getHexString()}`;
      ctx.fillRect(x, y, w, h);

      const rVal = Math.floor(
        config.roughness.min +
          Math.random() * (config.roughness.max - config.roughness.min),
      );
      roughCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      roughCtx.fillRect(x, y, w, h);
    }
  }

  return setupPBRMaps(colorCanvas, roughCanvas, config.tileScale);
}

function createConcreteTextures(baseColorHex: string): MaterialPBRMaps {
  const config = Config.facadeTexture.concrete;
  const size = Config.facadeTexture.size;

  const colorCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = size;
  roughCanvas.width = roughCanvas.height = size;

  const ctx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex);
  const imgData = ctx.createImageData(size, size);
  const roughData = roughCtx.createImageData(size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * config.colorNoise;
    imgData.data[i] = THREE.MathUtils.clamp(base.r * 255 + noise, 0, 255);
    imgData.data[i + 1] = THREE.MathUtils.clamp(base.g * 255 + noise, 0, 255);
    imgData.data[i + 2] = THREE.MathUtils.clamp(base.b * 255 + noise, 0, 255);
    imgData.data[i + 3] = 255;

    const rNoise =
      config.roughness.base + (Math.random() - 0.5) * config.roughness.noise;
    roughData.data[i] = rNoise;
    roughData.data[i + 1] = rNoise;
    roughData.data[i + 2] = rNoise;
    roughData.data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  if (config.formworkSeam.enabled) {
    ctx.strokeStyle = config.formworkSeam.color;
    ctx.lineWidth = config.formworkSeam.width;
    ctx.beginPath();
    ctx.moveTo(0, size * config.formworkSeam.position);
    ctx.lineTo(size, size * config.formworkSeam.position);
    ctx.stroke();
  }

  return setupPBRMaps(colorCanvas, roughCanvas, config.tileScale);
}

function createGlassTextures(baseColorHex: string): MaterialPBRMaps {
  const config = Config.facadeTexture.glass;
  const cellPx = 128;
  const cols = config.atlasCols;
  const rows = config.atlasRows;
  const atlasWidth = cellPx * cols;
  const atlasHeight = cellPx * rows;

  const colorCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  const emissiveCanvas = document.createElement("canvas");
  colorCanvas.width = roughCanvas.width = emissiveCanvas.width = atlasWidth;
  colorCanvas.height = roughCanvas.height = emissiveCanvas.height = atlasHeight;

  const ctx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;
  const emissiveCtx = emissiveCanvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex);
  const frameThicknessPx = cellPx * config.frame.thickness;
  const spandrelHeightPx = cellPx * config.spandrel.heightFraction;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellPx;
      const y = row * cellPx;

      ctx.fillStyle = config.frame.color;
      ctx.fillRect(x, y, cellPx, cellPx);
      roughCtx.fillStyle = config.roughnessColor;
      roughCtx.fillRect(x, y, cellPx, cellPx);
      emissiveCtx.fillStyle = "#000000";
      emissiveCtx.fillRect(x, y, cellPx, cellPx);

      ctx.fillStyle = config.spandrel.color;
      ctx.fillRect(x, y + cellPx - spandrelHeightPx, cellPx, spandrelHeightPx);

      const paneX = x + frameThicknessPx;
      const paneY = y + frameThicknessPx;
      const paneW = cellPx - frameThicknessPx * 2;
      const paneH = cellPx - spandrelHeightPx - frameThicknessPx * 2;

      const tint = (Math.random() - 0.5) * config.pane.tintVariation;
      const paneColor = base.clone().offsetHSL(0, 0, tint);
      ctx.fillStyle = `#${paneColor.getHexString()}`;
      ctx.fillRect(paneX, paneY, paneW, paneH);

      if (Math.random() < config.pane.reflectionStreakChance) {
        const grad = ctx.createLinearGradient(
          paneX,
          paneY,
          paneX + paneW,
          paneY + paneH,
        );
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(
          0.5,
          `rgba(255,255,255,${0.08 + Math.random() * 0.12})`,
        );
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(paneX, paneY, paneW, paneH);
      }

      const paneRoughness = THREE.MathUtils.lerp(
        config.pane.roughness.min,
        config.pane.roughness.max,
        Math.random(),
      );
      const rVal = Math.round(paneRoughness * 255);
      roughCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      roughCtx.fillRect(paneX, paneY, paneW, paneH);

      if (Math.random() < config.night.litProbability) {
        emissiveCtx.fillStyle = config.night.litColor;
        emissiveCtx.fillRect(paneX, paneY, paneW, paneH);
      }
    }
  }

  return setupPBRMaps(
    colorCanvas,
    roughCanvas,
    [config.moduleWidth * cols, config.moduleHeight * rows],
    emissiveCanvas,
  );
}

function createPlasterTextures(baseColorHex: string): MaterialPBRMaps {
  const config = Config.facadeTexture.plaster;
  const size = Config.facadeTexture.size;

  const colorCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = size;
  roughCanvas.width = roughCanvas.height = size;

  const ctx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;

  const base = new THREE.Color(baseColorHex);
  const imgData = ctx.createImageData(size, size);
  const roughData = roughCtx.createImageData(size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const fineGrain = (Math.random() - 0.5) * config.colorNoise;
    imgData.data[i] = THREE.MathUtils.clamp(base.r * 255 + fineGrain, 0, 255);
    imgData.data[i + 1] = THREE.MathUtils.clamp(
      base.g * 255 + fineGrain,
      0,
      255,
    );
    imgData.data[i + 2] = THREE.MathUtils.clamp(
      base.b * 255 + fineGrain,
      0,
      255,
    );
    imgData.data[i + 3] = 255;

    const r =
      config.roughness.base + (Math.random() - 0.5) * config.roughness.noise;
    roughData.data[i] = r;
    roughData.data[i + 1] = r;
    roughData.data[i + 2] = r;
    roughData.data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  return setupPBRMaps(colorCanvas, roughCanvas, config.tileScale);
}

function setupPBRMaps(
  colorCanvas: HTMLCanvasElement,
  roughCanvas: HTMLCanvasElement,
  tileScale: [number, number],
  emissiveCanvas?: HTMLCanvasElement,
): MaterialPBRMaps {
  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  let emissiveMap: THREE.CanvasTexture | undefined;
  if (emissiveCanvas) {
    emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
    emissiveMap.wrapS = THREE.RepeatWrapping;
    emissiveMap.wrapT = THREE.RepeatWrapping;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
  }

  return { map, roughnessMap, emissiveMap, tileScale };
}

export default function getProceduralTextures(
  type: FacadeTextureType,
  baseColorHex: string,
): MaterialPBRMaps {
  const cacheKey = `${type}_${baseColorHex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  let maps: MaterialPBRMaps;
  switch (type) {
    case "brick":
      maps = createBrickTextures(baseColorHex);
      break;
    case "concrete":
      maps = createConcreteTextures(baseColorHex);
      break;
    case "glass":
      maps = createGlassTextures(baseColorHex);
      break;
    case "plaster":
    default:
      maps = createPlasterTextures(baseColorHex);
      break;
  }

  textureCache.set(cacheKey, maps);
  return maps;
}
