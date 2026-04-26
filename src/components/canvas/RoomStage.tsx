import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useRoomSession } from "@/lib/room-session";

const WALL_HEIGHT = 2.8;
const WALL_THICKNESS = 0.18;

const HARDCODED_ROOMS = [
  { id: "living",  name: "Living Room", type: "living",   x: 1.68, y: 1.6,  width: 2.49, height: 1.98, wallColor: "#E8DDD0", floorColor: "#C4A882", temp: 22, absorption: 0.45 },
  { id: "kitchen", name: "Kitchen",     type: "kitchen",  x: 1.68, y: 0,    width: 2.49, height: 1.6,  wallColor: "#E5E0D5", floorColor: "#A09070", temp: 25, absorption: 0.35 },
  { id: "bedroom", name: "Bed Room",    type: "bedroom",  x: 4.17, y: 0,    width: 2.44, height: 2.44, wallColor: "#D8E0E8", floorColor: "#8890A0", temp: 21, absorption: 0.65 },
  { id: "toilet",  name: "Toilet",      type: "bathroom", x: 4.17, y: 2.44, width: 1.42, height: 1.14, wallColor: "#E0EEEE", floorColor: "#90B8B8", temp: 23, absorption: 0.25 },
  { id: "shop1",   name: "Shop 1",      type: "other",    x: 1.68, y: 3.58, width: 2.49, height: 1.83, wallColor: "#E5DDD5", floorColor: "#B8A888", temp: 22, absorption: 0.50 },
  { id: "shop2",   name: "Shop 2",      type: "other",    x: 4.17, y: 3.58, width: 2.44, height: 1.83, wallColor: "#E5DDD5", floorColor: "#B8A888", temp: 22, absorption: 0.50 },
  { id: "sitout",  name: "Sitout",      type: "hallway",  x: 0,    y: 1.6,  width: 1.68, height: 3.2,  wallColor: "#EDE8E0", floorColor: "#B0A898", temp: 21, absorption: 0.40 },
];

export const ROOM_LIST = HARDCODED_ROOMS;
export type AnalysisMode = "none" | "thermal" | "wifi" | "acoustic";

const FURNITURE_DIMS: Record<string, { w: number; h: number; d: number }> = {
  sofa:  { w: 2.0,  h: 0.85, d: 0.9  },
  chair: { w: 0.65, h: 1.0,  d: 0.65 },
  table: { w: 1.2,  h: 0.75, d: 0.7  },
  desk:  { w: 1.4,  h: 0.75, d: 0.7  },
  bed:   { w: 1.6,  h: 0.55, d: 2.0  },
  lamp:  { w: 0.35, h: 1.6,  d: 0.35 },
  tv:    { w: 1.2,  h: 0.7,  d: 0.08 },
  rug:   { w: 2.0,  h: 0.02, d: 1.4  },
  plant: { w: 0.4,  h: 0.8,  d: 0.4  },
  shelf: { w: 0.9,  h: 1.8,  d: 0.35 },
  other: { w: 0.6,  h: 0.6,  d: 0.6  },
};

function resolveColor(input: string, fallback: string): string {
  if (!input || !input.trim()) return fallback;
  const trimmed = input.trim();
  if (/^#[0-9a-f]{3,6}$/i.test(trimmed)) return trimmed;
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return fallback;
  c.fillStyle = "#aabbcc";
  c.fillStyle = trimmed;
  return c.fillStyle !== "#aabbcc" ? c.fillStyle : fallback;
}

function makeWoodTexture(color: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 2;
  const plankW = 64;
  for (let x = 0; x < size; x += plankW) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
  }
  for (let y = 0; y < size; y += 128) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }
  for (let i = 0; i < 500; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    ctx.lineWidth = 0.5;
    const x = Math.random() * size;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random()-0.5)*30, size); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeConcreteTexture(color: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = Math.random();
    ctx.fillStyle = v > 0.5
      ? `rgba(255,255,255,${Math.random() * 0.04})`
      : `rgba(0,0,0,${Math.random() * 0.05})`;
    ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
  }
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y + (Math.random()-0.5)*4); ctx.lineTo(size, y + (Math.random()-0.5)*4); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeTilesTexture(color: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const tileSize = 64;
  for (let row = 0; row < size / tileSize; row++) {
    for (let col = 0; col < size / tileSize; col++) {
      ctx.fillStyle = color;
      ctx.fillRect(col * tileSize + 1, row * tileSize + 1, tileSize - 2, tileSize - 2);
      ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.04})`;
      ctx.fillRect(col * tileSize + 1, row * tileSize + 1, tileSize - 2, tileSize - 2);
    }
  }
  ctx.strokeStyle = "rgba(180,175,170,0.9)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeMarbleTexture(color: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (let v = 0; v < 12; v++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.strokeStyle = `rgba(200,195,190,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    let x = Math.random() * size;
    let y = Math.random() * size;
    for (let s = 0; s < 20; s++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.3) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "rgba(255,255,255,0.06)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0.04)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  return tex;
}

function makeBrickTexture(color: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const bw = 80, bh = 32;
  for (let row = 0; row < size / bh; row++) {
    const offset = (row % 2) * (bw / 2);
    for (let col = -1; col < size / bw + 1; col++) {
      const x = col * bw + offset;
      const y = row * bh;
      const vary = (Math.random() - 0.5) * 20;
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      ctx.fillStyle = `rgba(${vary > 0 ? 255 : 0},0,0,${Math.abs(vary) * 0.004})`;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  ctx.strokeStyle = "rgba(210,205,195,0.85)";
  ctx.lineWidth = 2;
  for (let row = 0; row < size / bh + 1; row++) {
    const offset = (row % 2) * (bw / 2);
    for (let col = -1; col < size / bw + 1; col++) {
      const x = col * bw + offset;
      const y = row * bh;
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makePlasterTexture(color: string): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeTeakTexture(color: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 800; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
    ctx.lineWidth = 0.4;
    const x = Math.random() * size;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random()-0.5)*10, size); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

type MaterialPreset = {
  keywords: string[];
  makeFloor: (color: string) => THREE.CanvasTexture;
  makeWall: (color: string) => THREE.CanvasTexture;
  roughness: number;
  metalness: number;
};

const MATERIAL_PRESETS: MaterialPreset[] = [
  { keywords: ["concrete", "cement", "brutalist"], makeFloor: makeConcreteTexture, makeWall: makeConcreteTexture, roughness: 0.95, metalness: 0.0 },
  { keywords: ["tile", "tiles", "ceramic", "porcelain", "terracotta"], makeFloor: makeTilesTexture, makeWall: makeTilesTexture, roughness: 0.3, metalness: 0.05 },
  { keywords: ["marble", "stone", "granite", "travertine"], makeFloor: makeMarbleTexture, makeWall: makeMarbleTexture, roughness: 0.2, metalness: 0.08 },
  { keywords: ["brick", "exposed brick", "masonry"], makeFloor: makeBrickTexture, makeWall: makeBrickTexture, roughness: 0.9, metalness: 0.0 },
  { keywords: ["teak"], makeFloor: makeTeakTexture, makeWall: makeTeakTexture, roughness: 0.7, metalness: 0.0 },
  { keywords: ["plaster", "lime plaster", "stucco", "gypsum", "drywall", "paint", "painted"], makeFloor: makePlasterTexture, makeWall: makePlasterTexture, roughness: 0.88, metalness: 0.0 },
  { keywords: ["wood", "oak", "pine", "hardwood", "parquet", "laminate", "wide-plank", "wide plank"], makeFloor: makeWoodTexture, makeWall: makeWoodTexture, roughness: 0.82, metalness: 0.0 },
];

function resolvePreset(keyword: string): MaterialPreset | null {
  if (!keyword) return null;
  const lower = keyword.toLowerCase().trim();
  return MATERIAL_PRESETS.find((p) => p.keywords.some((k) => lower.includes(k))) ?? null;
}

function makeFloorTexture(color: string): THREE.CanvasTexture { return makeWoodTexture(color); }
function makeWallTexture(color: string): THREE.CanvasTexture { return makePlasterTexture(color); }

function makeThermalTexture(temp: number): THREE.CanvasTexture {
  const t = Math.max(0, Math.min(1, (temp - 18) / 10));
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const grad = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size * 0.7);
  const r = Math.round(t < 0.5 ? 0 : (t - 0.5) * 2 * 255);
  const g = Math.round(t < 0.25 ? 0 : t < 0.75 ? ((t - 0.25) / 0.5) * 200 : (1 - (t - 0.75) / 0.25) * 200);
  const b = Math.round(t < 0.5 ? (1 - t * 2) * 220 + 35 : 0);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.75)`);
  grad.addColorStop(1, `rgba(${Math.max(0,r-40)},${Math.max(0,g-30)},${Math.max(0,b-20)},0.4)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = `rgba(255,255,255,0.12)`;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const rad = (size / 2) * (i / 5);
    ctx.beginPath();
    ctx.ellipse(size/2, size/2, rad * 1.3, rad * 0.9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

function makeWifiTexture(strength: number, timeOffset: number = 0): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const cx = size * 0.5, cy = size * 0.5;
  const numRings = 12;
  for (let i = numRings; i >= 0; i--) {
    const ratio = ((i + timeOffset) % numRings) / numRings;
    const radius = ratio * size * 0.55 * strength;
    const alpha = (1 - ratio) * 0.65 * strength;
    const hue = ratio < 0.3 ? 240 : ratio < 0.6 ? 120 : ratio < 0.85 ? 55 : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
    ctx.lineWidth = 2 + (1 - ratio) * 5;
    ctx.stroke();
  }
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35);
  grd.addColorStop(0, `rgba(255,255,255,${0.6 * strength})`);
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.fill();
  return new THREE.CanvasTexture(c);
}

function makeAcousticsTexture(absorption: number): THREE.CanvasTexture {
  const reflectivity = 1 - absorption;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const r = Math.round(120 + reflectivity * 80);
  const g = Math.round(60 + absorption * 40);
  const b = Math.round(180 - reflectivity * 80);
  ctx.fillStyle = `rgba(${r},${g},${b},0.65)`;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = `rgba(255,240,200,${0.15 + reflectivity * 0.2})`;
  ctx.lineWidth = 1;
  const freq = 4 + Math.round(reflectivity * 6);
  for (let y = 0; y < size; y += size / freq) {
    ctx.beginPath();
    for (let x = 0; x < size; x++) {
      const wave = Math.sin((x / size) * Math.PI * freq * 2) * 8 * reflectivity;
      if (x === 0) ctx.moveTo(x, y + wave); else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  return new THREE.CanvasTexture(c);
}

const ROUTER = { x: 1.68 + 2.49/2, z: 1.6 + 1.98/2 };
function wifiStrength(room: typeof HARDCODED_ROOMS[0]): number {
  const cx = room.x + room.width / 2;
  const cz = room.y + room.height / 2;
  const dist = Math.sqrt((cx - ROUTER.x)**2 + (cz - ROUTER.z)**2);
  return Math.max(0.15, 1 - dist / 12);
}

const IN_TO_M = 0.0254;

function stripWhiteBackground(texture: THREE.Texture): THREE.CanvasTexture {
  const img = texture.image as HTMLImageElement;
  const c = document.createElement("canvas");
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r > 230 && g > 230 && b > 230) {
      data[i+3] = 0;
    } else if (r > 200 && g > 200 && b > 200) {
      const brightness = (r + g + b) / 3;
      data[i+3] = Math.round(((255 - brightness) / 55) * 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const newTex = new THREE.CanvasTexture(c);
  newTex.colorSpace = THREE.SRGBColorSpace;
  return newTex;
}

async function createBillboardFurniture(
  type: string,
  imageUrl: string,
  dims: { w: number; h: number; d: number }
): Promise<THREE.Group> {
  const group = new THREE.Group();
  group.userData.isFurniture = true;

  const rawTexture = await new Promise<THREE.Texture | null>((resolve) => {
    if (!imageUrl) return resolve(null);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(imageUrl, resolve, undefined, () => resolve(null));
  });

  const texture = rawTexture ? stripWhiteBackground(rawTexture) : null;

  const shadowGeo = new THREE.CircleGeometry(dims.w * 0.4, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  const ringGeo = new THREE.RingGeometry(dims.w * 0.42, dims.w * 0.52, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.visible = false;
  ring.userData.isSelectionRing = true;
  group.add(ring);

  if (texture) {
    const img = rawTexture!.image as HTMLImageElement;
    const aspect = img.width / img.height;
    const planeH = dims.h;
    const planeW = planeH * aspect;
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.05,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat);
    plane.position.y = planeH / 2;
    group.add(plane);
  } else {
    const mat = new THREE.MeshLambertMaterial({ color: "#CCBBAA" });
    const box = new THREE.Mesh(new THREE.BoxGeometry(dims.w, dims.h, dims.d), mat);
    box.position.y = dims.h / 2;
    group.add(box);
  }

  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      (obj as THREE.Mesh).castShadow = true;
      (obj as THREE.Mesh).receiveShadow = true;
    }
  });
  return group;
}

function getCameraForRoom(roomId: string | null, aspect: number) {
  const rooms = roomId ? HARDCODED_ROOMS.filter((r) => r.id === roomId) : HARDCODED_ROOMS;
  const minX = Math.min(...rooms.map((r) => r.x));
  const maxX = Math.max(...rooms.map((r) => r.x + r.width));
  const minZ = Math.min(...rooms.map((r) => r.y));
  const maxZ = Math.max(...rooms.map((r) => r.y + r.height));
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxZ - minZ, 1.5);
  const fovRad = (50 * Math.PI) / 180;
  const radius = Math.max(4, (span / (2 * Math.tan(fovRad / 2))) * 1.6);
  return {
    target: new THREE.Vector3(cx, 0, cz),
    phi: roomId ? 1.0 : 0.82,
    theta: 0.65,
    radius,
  };
}

function raycastFloor(
  clientX: number, clientY: number,
  canvas: HTMLElement,
  camera: THREE.PerspectiveCamera
): THREE.Vector3 | null {
  const rect = canvas.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, target);
  return target;
}

export function RoomStage({ selectedRoomId, onRoomSelect, onItemPlaced, analysisMode = "none" }: {
  selectedRoomId: string | null;
  onRoomSelect: (id: string | null) => void;
  onItemPlaced?: () => void;
  analysisMode?: AnalysisMode;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { generatedImage, imageAdjust, aiDirection, linkPreview } = useRoomSession();

  const wallMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const floorMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const camStateRef = useRef({ theta: 0.65, phi: 0.82, radius: 18, target: new THREE.Vector3(3.3, 0, 2.7) });

  const overlayMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const wifiMatsRef = useRef<Map<string, THREE.MeshBasicMaterial>>(new Map());
  const wifiTimeRef = useRef(0);
  const analysisModeRef = useRef(analysisMode);

  const furnitureGroupsRef = useRef<THREE.Group[]>([]);
  const selectedFurnitureRef = useRef<THREE.Group | null>(null);
  const isDraggingFurnitureRef = useRef(false);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const placedLinksRef = useRef<Set<object>>(new Set());
  const [placedCount, setPlacedCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState(false);

  const updateCamera = () => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { theta, phi, radius, target } = camStateRef.current;
    cam.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(target);
  };

  useEffect(() => { analysisModeRef.current = analysisMode; }, [analysisMode]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const preset = resolvePreset(aiDirection.wallMaterial || "");
    wallMatsRef.current.forEach((m, i) => {
      const colorHex = resolveColor(aiDirection.wallColour, HARDCODED_ROOMS[i]?.wallColor || "#E8DDD0");
      if (preset) { m.map = preset.makeWall(colorHex); m.roughness = preset.roughness; m.metalness = preset.metalness; }
      else { m.map = makeWallTexture(colorHex); m.roughness = 0.9; m.metalness = 0.0; }
      m.color.set("#ffffff"); m.needsUpdate = true;
    });
  }, [aiDirection.wallMaterial]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const preset = resolvePreset(aiDirection.floorMaterial || "");
    floorMatsRef.current.forEach((m, i) => {
      const colorHex = resolveColor(aiDirection.floorColour, HARDCODED_ROOMS[i]?.floorColor || "#C4A882");
      if (preset) { m.map = preset.makeFloor(colorHex); m.roughness = preset.roughness; m.metalness = preset.metalness; }
      else { m.map = makeFloorTexture(colorHex); m.roughness = 0.85; m.metalness = 0.0; }
      m.color.set("#ffffff"); m.needsUpdate = true;
    });
  }, [aiDirection.floorMaterial]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const hex = resolveColor(aiDirection.wallColour, "");
    wallMatsRef.current.forEach((m, i) => {
      const base = hex || HARDCODED_ROOMS[i]?.wallColor || "#E8DDD0";
      const preset = resolvePreset(aiDirection.wallMaterial || "");
      m.map = preset ? preset.makeWall(base) : makeWallTexture(base);
      m.color.set("#ffffff"); m.needsUpdate = true;
    });
  }, [aiDirection.wallColour]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const hex = resolveColor(aiDirection.floorColour, "");
    floorMatsRef.current.forEach((m, i) => {
      const base = hex || HARDCODED_ROOMS[i]?.floorColor || "#C4A882";
      const preset = resolvePreset(aiDirection.floorMaterial || "");
      m.map = preset ? preset.makeFloor(base) : makeFloorTexture(base);
      m.color.set("#ffffff"); m.needsUpdate = true;
    });
  }, [aiDirection.floorColour]);

  useEffect(() => {
    overlayMeshesRef.current.forEach((meshes, roomId) => {
      const room = HARDCODED_ROOMS.find(r => r.id === roomId);
      if (!room) return;
      const isVisible = analysisMode !== "none" &&
        (selectedRoomId === null || roomId === selectedRoomId);
      meshes.forEach((mesh) => {
        mesh.visible = isVisible;
        if (!isVisible) return;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (analysisMode === "thermal") { mat.map = makeThermalTexture(room.temp); mat.needsUpdate = true; }
        else if (analysisMode === "wifi") { mat.map = makeWifiTexture(wifiStrength(room), 0); mat.needsUpdate = true; }
        else if (analysisMode === "acoustic") { mat.map = makeAcousticsTexture(room.absorption); mat.needsUpdate = true; }
      });
    });
  }, [analysisMode, selectedRoomId]);

  useEffect(() => {
    if (!sceneRef.current || !mountRef.current) return;
    const aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
    const target = getCameraForRoom(selectedRoomId, aspect);
    const start = { ...camStateRef.current, target: camStateRef.current.target.clone() };
    const dur = 550;
    const t0 = performance.now();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = (now: number) => {
      const raw = Math.min(1, (now - t0) / dur);
      const p = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      camStateRef.current.theta = lerp(start.theta, target.theta, p);
      camStateRef.current.phi = lerp(start.phi, target.phi, p);
      camStateRef.current.radius = lerp(start.radius, target.radius, p);
      camStateRef.current.target.set(lerp(start.target.x, target.target.x, p), 0, lerp(start.target.z, target.target.z, p));
      updateCamera();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    sceneRef.current.traverse((obj) => {
      if (obj.userData.roomId !== undefined && !obj.userData.isOverlay) {
        obj.visible = selectedRoomId === null || obj.userData.roomId === selectedRoomId;
      }
    });
  }, [selectedRoomId]);

  useEffect(() => {
    if (!linkPreview || !sceneRef.current) return;
    if (placedLinksRef.current.has(linkPreview)) return;
    placedLinksRef.current.add(linkPreview);

    const roomId = selectedRoomId || "living";
    const room = HARDCODED_ROOMS.find((r) => r.id === roomId) || HARDCODED_ROOMS[0];
    const type = linkPreview.type || "other";
    const BASE = FURNITURE_DIMS[type] || FURNITURE_DIMS.other;

    const dims = {
      w: Math.max(0.2, Math.min(4.0, (linkPreview.width  ?? BASE.w * (1 / IN_TO_M)) * IN_TO_M)),
      h: Math.max(0.2, Math.min(3.0, (linkPreview.height ?? BASE.h * (1 / IN_TO_M)) * IN_TO_M)),
      d: Math.max(0.2, Math.min(4.0, (linkPreview.depth  ?? BASE.d * (1 / IN_TO_M)) * IN_TO_M)),
    };

    const itemIndex = placedLinksRef.current.size - 1;
    const offsetX = (itemIndex % 3) * 0.5 - 0.5;
    const offsetZ = Math.floor(itemIndex / 3) * 0.5;

    createBillboardFurniture(type, linkPreview.image || "", dims).then((group) => {
      if (!sceneRef.current) return;
      group.position.set(
        room.x + room.width / 2 + offsetX,
        0,
        room.y + room.height / 2 + offsetZ
      );
      group.userData.roomId = roomId;
      group.userData.isFurniture = true;
      group.rotation.y = Math.PI / 6;
      sceneRef.current.add(group);
      furnitureGroupsRef.current.push(group);
      setPlacedCount((n) => n + 1);
      onItemPlaced?.();
    });
  }, [linkPreview]);

  useEffect(() => {
    if (!mountRef.current) return;
    wallMatsRef.current = [];
    floorMatsRef.current = [];
    overlayMeshesRef.current = new Map();
    wifiMatsRef.current = new Map();

    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#F0EBE3");
    scene.fog = new THREE.FogExp2("#F0EBE3", 0.018);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xFFF5E8, 0.5);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xFFEDD0, 2.0);
    sun.position.set(12, 22, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.001;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xC8D8FF, 0.6);
    fill.position.set(-10, 8, -8);
    scene.add(fill);
    const bounce = new THREE.DirectionalLight(0xFFE8C0, 0.3);
    bounce.position.set(0, -5, 0);
    scene.add(bounce);

    const groundMat = new THREE.MeshStandardMaterial({ color: "#E8E0D8", roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    HARDCODED_ROOMS.forEach((room) => {
      const floorTex = makeFloorTexture(room.floorColor);
      const wallTex = makeWallTexture(room.wallColor);
      const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.0 });
      const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0.0 });
      wallMatsRef.current.push(wallMat);
      floorMatsRef.current.push(floorMat);

      const tag = (o: THREE.Object3D) => { o.userData.roomId = room.id; return o; };

      const floor = tag(new THREE.Mesh(new THREE.BoxGeometry(room.width, 0.1, room.height), floorMat));
      (floor as THREE.Mesh).receiveShadow = true;
      floor.position.set(room.x + room.width / 2, -0.05, room.y + room.height / 2);
      scene.add(floor);

      const backWall = tag(new THREE.Mesh(new THREE.BoxGeometry(room.width + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS), wallMat));
      (backWall as THREE.Mesh).castShadow = true; (backWall as THREE.Mesh).receiveShadow = true;
      backWall.position.set(room.x + room.width / 2, WALL_HEIGHT / 2, room.y);
      scene.add(backWall);

      const leftWall = tag(new THREE.Mesh(new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, room.height + WALL_THICKNESS), wallMat));
      (leftWall as THREE.Mesh).castShadow = true; (leftWall as THREE.Mesh).receiveShadow = true;
      leftWall.position.set(room.x, WALL_HEIGHT / 2, room.y + room.height / 2);
      scene.add(leftWall);

      const skirtMat = new THREE.MeshStandardMaterial({ color: "#F5F0EB", roughness: 0.6 });
      const skirtBack = tag(new THREE.Mesh(new THREE.BoxGeometry(room.width, 0.1, 0.03), skirtMat));
      skirtBack.position.set(room.x + room.width / 2, 0.05, room.y + WALL_THICKNESS / 2);
      scene.add(skirtBack);
      const skirtLeft = tag(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, room.height), skirtMat));
      skirtLeft.position.set(room.x + WALL_THICKNESS / 2, 0.05, room.y + room.height / 2);
      scene.add(skirtLeft);

      const c2d = document.createElement("canvas");
      c2d.width = 256; c2d.height = 64;
      const ctx = c2d.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 256, 64);
        ctx.fillStyle = "rgba(45,36,22,0.5)";
        ctx.font = "bold 18px serif";
        ctx.textAlign = "center";
        ctx.fillText(room.name, 128, 38);
      }
      const label = tag(new THREE.Mesh(
        new THREE.PlaneGeometry(room.width * 0.8, 0.45),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2d), transparent: true, side: THREE.DoubleSide, depthWrite: false })
      ));
      label.position.set(room.x + room.width / 2, 0.06, room.y + room.height / 2);
      label.rotation.x = -Math.PI / 2;
      scene.add(label);

      const overlayMeshes: THREE.Mesh[] = [];
      const makeOverlayMat = () => new THREE.MeshBasicMaterial({
        map: makeThermalTexture(room.temp),
        transparent: true, opacity: 1,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const floorOverlay = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.height), makeOverlayMat());
      floorOverlay.rotation.x = -Math.PI / 2;
      floorOverlay.position.set(room.x + room.width / 2, 0.07, room.y + room.height / 2);
      floorOverlay.userData.roomId = room.id;
      floorOverlay.userData.isOverlay = true;
      floorOverlay.visible = false;
      scene.add(floorOverlay); overlayMeshes.push(floorOverlay);

      const backWallOverlay = new THREE.Mesh(new THREE.PlaneGeometry(room.width, WALL_HEIGHT), makeOverlayMat());
      backWallOverlay.position.set(room.x + room.width / 2, WALL_HEIGHT / 2, room.y + WALL_THICKNESS / 2 + 0.01);
      backWallOverlay.userData.roomId = room.id;
      backWallOverlay.userData.isOverlay = true;
      backWallOverlay.visible = false;
      scene.add(backWallOverlay); overlayMeshes.push(backWallOverlay);

      const leftWallOverlay = new THREE.Mesh(new THREE.PlaneGeometry(room.height, WALL_HEIGHT), makeOverlayMat());
      leftWallOverlay.rotation.y = Math.PI / 2;
      leftWallOverlay.position.set(room.x + WALL_THICKNESS / 2 + 0.01, WALL_HEIGHT / 2, room.y + room.height / 2);
      leftWallOverlay.userData.roomId = room.id;
      leftWallOverlay.userData.isOverlay = true;
      leftWallOverlay.visible = false;
      scene.add(leftWallOverlay); overlayMeshes.push(leftWallOverlay);

      overlayMeshesRef.current.set(room.id, overlayMeshes);
      wifiMatsRef.current.set(room.id, floorOverlay.material as THREE.MeshBasicMaterial);
    });

    const initCam = getCameraForRoom(null, w / h);
    camStateRef.current = { theta: initCam.theta, phi: initCam.phi, radius: initCam.radius, target: initCam.target.clone() };
    updateCamera();

    let isCamDragging = false;
    let mouseDownPos = { x: 0, y: 0 };

    const selectFurniture = (group: THREE.Group | null) => {
      if (selectedFurnitureRef.current) {
        selectedFurnitureRef.current.traverse((obj) => {
          if ((obj as THREE.Mesh).userData?.isSelectionRing) (obj as THREE.Mesh).visible = false;
        });
      }
      selectedFurnitureRef.current = group;
      setSelectedItem(!!group);
      if (group) {
        group.traverse((obj) => {
          if ((obj as THREE.Mesh).userData?.isSelectionRing) (obj as THREE.Mesh).visible = true;
        });
      }
    };

    const getFurnitureUnderCursor = (clientX: number, clientY: number): THREE.Group | null => {
      if (!cameraRef.current) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);
      const meshes: THREE.Mesh[] = [];
      furnitureGroupsRef.current.forEach((grp) => {
        grp.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh && !obj.userData.isSelectionRing) {
            meshes.push(obj as THREE.Mesh);
          }
        });
      });
      const hits = raycaster.intersectObjects(meshes, false);
      if (!hits.length) return null;
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj) {
        if (obj.userData.isFurniture) return obj as THREE.Group;
        obj = obj.parent;
      }
      return null;
    };

    const onDown = (e: MouseEvent) => {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      pointerDownPosRef.current = mouseDownPos;
      const hit = getFurnitureUnderCursor(e.clientX, e.clientY);
      if (hit) {
        selectFurniture(hit);
        isDraggingFurnitureRef.current = true;
        isCamDragging = false;
        const floorPt = raycastFloor(e.clientX, e.clientY, renderer.domElement, cameraRef.current!);
        if (floorPt) {
          dragOffsetRef.current.set(hit.position.x - floorPt.x, 0, hit.position.z - floorPt.z);
        }
      } else {
        isCamDragging = true;
      }
    };

    const onMove = (e: MouseEvent) => {
      if (isDraggingFurnitureRef.current && selectedFurnitureRef.current && cameraRef.current) {
        const floorPt = raycastFloor(e.clientX, e.clientY, renderer.domElement, cameraRef.current);
        if (floorPt) {
          selectedFurnitureRef.current.position.x = floorPt.x + dragOffsetRef.current.x;
          selectedFurnitureRef.current.position.z = floorPt.z + dragOffsetRef.current.z;
        }
        return;
      }
      if (!isCamDragging) return;
      camStateRef.current.theta -= (e.clientX - mouseDownPos.x) * 0.005;
      camStateRef.current.phi = Math.max(0.15, Math.min(1.45, camStateRef.current.phi + (e.clientY - mouseDownPos.y) * 0.005));
      mouseDownPos = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const onUp = (e: MouseEvent) => {
      isDraggingFurnitureRef.current = false;
      isCamDragging = false;
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dz = e.clientY - pointerDownPosRef.current.y;
      const moved = Math.sqrt(dx * dx + dz * dz);
      if (moved < 4 && !getFurnitureUnderCursor(e.clientX, e.clientY)) {
        selectFurniture(null);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (selectedFurnitureRef.current) {
        selectedFurnitureRef.current.rotation.y += e.deltaY * 0.005;
        return;
      }
      camStateRef.current.radius = Math.max(3, Math.min(40, camStateRef.current.radius + e.deltaY * 0.02));
      updateCamera();
    };

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth, nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel);
    window.addEventListener("resize", onResize);

    let animId: number;
    let lastWifiUpdate = 0;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      if (analysisModeRef.current === "wifi" && time - lastWifiUpdate > 80) {
        lastWifiUpdate = time;
        wifiTimeRef.current = (wifiTimeRef.current + 0.5) % 12;
        HARDCODED_ROOMS.forEach((room) => {
          const mat = wifiMatsRef.current.get(room.id);
          if (mat && mat.visible) {
            mat.map?.dispose();
            mat.map = makeWifiTexture(wifiStrength(room), wifiTimeRef.current);
            mat.needsUpdate = true;
          }
        });
      }
      renderer.render(scene, camera);
    };
    animate(0);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mountRef.current?.contains(renderer.domElement)) mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const handleRemoveSelected = () => {
    const grp = selectedFurnitureRef.current;
    if (!grp || !sceneRef.current) return;
    sceneRef.current.remove(grp);
    furnitureGroupsRef.current = furnitureGroupsRef.current.filter((g) => g !== grp);
    selectedFurnitureRef.current = null;
    setSelectedItem(false);
    setPlacedCount((n) => n - 1);
  };

  if (generatedImage) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
        <img src={generatedImage} alt="AI generated room" className="animate-fade-in h-full w-full object-cover"
          style={{ filter: `brightness(${imageAdjust.brightness}%)` }} />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          AI redesign · ask again to update
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
      <div ref={mountRef} className="h-full w-full" />

      {analysisMode !== "none" && !selectedItem && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur whitespace-nowrap"
          style={{
            background: analysisMode === "thermal" ? "rgba(220,60,30,0.75)"
              : analysisMode === "wifi" ? "rgba(30,100,220,0.75)"
              : "rgba(100,30,180,0.75)",
            color: "#fff",
          }}>
          {analysisMode === "thermal" ? "🌡 Thermal overlay"
            : analysisMode === "wifi" ? "📶 WiFi signal overlay"
            : "🔊 Acoustics overlay"}
        </div>
      )}

      {selectedItem && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="rounded-full bg-card/90 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur whitespace-nowrap">
            drag to move · scroll to rotate · click elsewhere to deselect
          </div>
          <button
            onClick={handleRemoveSelected}
            className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white backdrop-blur whitespace-nowrap hover:bg-red-600 transition shadow-sm"
          >
            Remove
          </button>
        </div>
      )}

      {!selectedItem && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur whitespace-nowrap">
          {selectedRoomId
            ? <><span className="font-medium text-foreground">{HARDCODED_ROOMS.find(r => r.id === selectedRoomId)?.name}</span> · drag to rotate · scroll to zoom</>
            : <>Overview · drag to rotate · scroll to zoom · click item to move</>}
        </div>
      )}

      {placedCount > 0 && (
        <div className="absolute top-3 right-3 rounded-full bg-foreground px-3 py-1 text-[10px] text-background">
          {placedCount} item{placedCount !== 1 ? "s" : ""} placed
        </div>
      )}
    </div>
  );
}

