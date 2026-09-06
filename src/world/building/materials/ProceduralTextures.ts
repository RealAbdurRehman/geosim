import * as THREE from "three";

import Config from "../config/BuildingConfig";
import type { FacadeTextureType, WindowStyleConfig } from "../types";

interface MaterialPBRMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap?: THREE.CanvasTexture;
  tileScale: [number, number];
}

const textureCache = new Map<string, MaterialPBRMaps>();

function applyWindowPunch(
  colorCanvas: HTMLCanvasElement,
  roughCanvas: HTMLCanvasElement,
  tileScale: [number, number],
  style: WindowStyleConfig,
): void {
  if (style.density <= 0) return;

  const size = colorCanvas.width;
  const cols = Math.max(1, Math.round(tileScale[0] / style.moduleWidth));
  const rows = Math.max(1, Math.round(tileScale[1] / style.moduleHeight));
  const cellW = size / cols;
  const cellH = size / rows;

  const ctx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;

  const frameThicknessPx = Math.min(cellW, cellH) * style.frame.thickness;
  const sillHeightPx = cellH * style.sill.heightFraction;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > style.density) continue;

      const x = col * cellW;
      const y = row * cellH;
      const openW = cellW * 0.6;
      const openH = cellH * 0.55;
      const openX = x + (cellW - openW) / 2;
      const openY = y + (cellH - openH) / 2;

      ctx.fillStyle = style.frame.color;
      ctx.fillRect(
        openX - frameThicknessPx,
        openY - frameThicknessPx,
        openW + frameThicknessPx * 2,
        openH + frameThicknessPx * 2,
      );
      roughCtx.fillStyle = "#808080";
      roughCtx.fillRect(
        openX - frameThicknessPx,
        openY - frameThicknessPx,
        openW + frameThicknessPx * 2,
        openH + frameThicknessPx * 2,
      );

      ctx.fillStyle = style.sill.color;
      ctx.fillRect(
        openX - frameThicknessPx,
        openY + openH,
        openW + frameThicknessPx * 2,
        sillHeightPx,
      );

      const tint = (Math.random() - 0.5) * style.pane.tintVariation;
      const paneColor = new THREE.Color(style.pane.color).offsetHSL(0, 0, tint);
      ctx.fillStyle = `#${paneColor.getHexString()}`;
      ctx.fillRect(openX, openY, openW, openH);

      const paneRoughness = THREE.MathUtils.lerp(
        style.pane.roughness.min,
        style.pane.roughness.max,
        Math.random(),
      );
      const rVal = Math.round(paneRoughness * 255);
      roughCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      roughCtx.fillRect(openX, openY, openW, openH);
    }
  }
}

function createBrickTextures(
  baseColorHex: string,
  windowStyle: WindowStyleConfig,
): MaterialPBRMaps {
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

  applyWindowPunch(colorCanvas, roughCanvas, config.tileScale, windowStyle);
  return setupPBRMaps(colorCanvas, roughCanvas, config.tileScale);
}

function createConcreteTextures(
  baseColorHex: string,
  windowStyle: WindowStyleConfig,
): MaterialPBRMaps {
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

  applyWindowPunch(colorCanvas, roughCanvas, config.tileScale, windowStyle);
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
  colorCanvas.width = roughCanvas.width = atlasWidth;
  colorCanvas.height = roughCanvas.height = atlasHeight;

  const ctx = colorCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;

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
    }
  }

  return setupPBRMaps(colorCanvas, roughCanvas, [
    config.moduleWidth * cols,
    config.moduleHeight * rows,
  ]);
}

function createPlasterTextures(
  baseColorHex: string,
  windowStyle: WindowStyleConfig,
): MaterialPBRMaps {
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

  applyWindowPunch(colorCanvas, roughCanvas, config.tileScale, windowStyle);
  return setupPBRMaps(colorCanvas, roughCanvas, config.tileScale);
}

function createPlainTextures(baseColorHex: string): MaterialPBRMaps {
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
    const noise = (Math.random() - 0.5) * 6;
    imgData.data[i] = THREE.MathUtils.clamp(base.r * 255 + noise, 0, 255);
    imgData.data[i + 1] = THREE.MathUtils.clamp(base.g * 255 + noise, 0, 255);
    imgData.data[i + 2] = THREE.MathUtils.clamp(base.b * 255 + noise, 0, 255);
    imgData.data[i + 3] = 255;

    const r = 200 + (Math.random() - 0.5) * 20;
    roughData.data[i] = r;
    roughData.data[i + 1] = r;
    roughData.data[i + 2] = r;
    roughData.data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);

  return setupPBRMaps(colorCanvas, roughCanvas, [8.0, 8.0]);
}

function setupPBRMaps(
  colorCanvas: HTMLCanvasElement,
  roughCanvas: HTMLCanvasElement,
  tileScale: [number, number],
): MaterialPBRMaps {
  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, roughnessMap, tileScale };
}

export default function getProceduralTextures(
  type: FacadeTextureType,
  baseColorHex: string,
  windowStyleKey: string,
  skipFacadeWindows: boolean,
): MaterialPBRMaps {
  const cacheKey = skipFacadeWindows
    ? `plain_${baseColorHex}`
    : `${type}_${baseColorHex}_${windowStyleKey}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  if (skipFacadeWindows) {
    const maps = createPlainTextures(baseColorHex);
    textureCache.set(cacheKey, maps);
    return maps;
  }

  const windowStyle =
    Config.facadeTexture.window.styles[windowStyleKey] ??
    Config.facadeTexture.window.styles[
      Config.facadeTexture.window.defaultStyle
    ];

  let maps: MaterialPBRMaps;
  switch (type) {
    case "brick":
      maps = createBrickTextures(baseColorHex, windowStyle);
      break;
    case "concrete":
      maps = createConcreteTextures(baseColorHex, windowStyle);
      break;
    case "glass":
      maps = createGlassTextures(baseColorHex);
      break;
    case "plaster":
    default:
      maps = createPlasterTextures(baseColorHex, windowStyle);
      break;
  }

  textureCache.set(cacheKey, maps);
  return maps;
}
