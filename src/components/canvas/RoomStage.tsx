import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useRoomSession } from "@/lib/room-session";

const WALL_HEIGHT = 2.8;

const HARDCODED_ROOMS = [
  { id: "living",  name: "Living Room", type: "living",   x: 1.68, y: 1.6,  width: 2.49, height: 1.98, wallColor: "#F5F0E8", floorColor: "#C4A882" },
  { id: "kitchen", name: "Kitchen",     type: "kitchen",  x: 1.68, y: 0,    width: 2.49, height: 1.6,  wallColor: "#EEF0E8", floorColor: "#B8B090" },
  { id: "bedroom", name: "Bed Room",    type: "bedroom",  x: 4.17, y: 0,    width: 2.44, height: 2.44, wallColor: "#E8EEF0", floorColor: "#A8B0C0" },
  { id: "toilet",  name: "Toilet",      type: "bathroom", x: 4.17, y: 2.44, width: 1.42, height: 1.14, wallColor: "#EEF5F5", floorColor: "#B0C8C8" },
  { id: "shop1",   name: "Shop 1",      type: "other",    x: 1.68, y: 3.58, width: 2.49, height: 1.83, wallColor: "#F0EDE8", floorColor: "#D0C0A0" },
  { id: "shop2",   name: "Shop 2",      type: "other",    x: 4.17, y: 3.58, width: 2.44, height: 1.83, wallColor: "#F0EDE8", floorColor: "#D0C0A0" },
  { id: "sitout",  name: "Sitout",      type: "hallway",  x: 0,    y: 1.6,  width: 1.68, height: 3.2,  wallColor: "#F2EFE5", floorColor: "#C8C0B0" },
];

export const ROOM_LIST = HARDCODED_ROOMS;

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
  const noSpace = trimmed.replace(/\s+/g, "");
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return fallback;
  for (const attempt of [trimmed, noSpace]) {
    c.fillStyle = "#aabbcc";
    c.fillStyle = attempt;
    if (c.fillStyle !== "#aabbcc") return c.fillStyle;
  }
  return fallback;
}

// Billboard: real product image as a flat upright plane in 3D
async function createBillboardFurniture(type: string, imageUrl: string): Promise<THREE.Group> {
  const group = new THREE.Group();
  const dims = FURNITURE_DIMS[type] || FURNITURE_DIMS.other;

  const texture = await new Promise<THREE.Texture | null>((resolve) => {
    if (!imageUrl) return resolve(null);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(imageUrl, resolve, undefined, () => resolve(null));
  });

  if (texture) texture.colorSpace = THREE.SRGBColorSpace;

  // Shadow blob on floor
  const shadowGeo = new THREE.CircleGeometry(dims.w * 0.4, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  group.add(shadow);

  if (texture) {
    // Two-sided billboard so it's visible from all angles
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, alphaTest: 0.05 });
    const geo = new THREE.PlaneGeometry(dims.w, dims.h);
    const plane = new THREE.Mesh(geo, mat);
    plane.position.y = dims.h / 2;
    group.add(plane);

    // Thin backing so it reads as a 3D object from the side
    const sideMat = new THREE.MeshLambertMaterial({ color: "#CCBBAA" });
    const side = new THREE.Mesh(new THREE.BoxGeometry(dims.w, dims.h, 0.04), sideMat);
    side.position.y = dims.h / 2;
    group.add(side);
  } else {
    // Fallback plain box
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

export function RoomStage({ selectedRoomId, onRoomSelect, onItemPlaced }: {
  selectedRoomId: string | null;
  onRoomSelect: (id: string | null) => void;
  onItemPlaced?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const { generatedImage, imageAdjust, aiDirection, linkPreview } = useRoomSession();

  const wallMatsRef = useRef<THREE.MeshLambertMaterial[]>([]);
  const floorMatsRef = useRef<THREE.MeshLambertMaterial[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const camStateRef = useRef({ theta: 0.65, phi: 0.82, radius: 18, target: new THREE.Vector3(3.3, 0, 2.7) });

  const prevLinkRef = useRef<any>(null);
  const [placedCount, setPlacedCount] = useState(0);

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

  // Wall colour — reset to room defaults when cleared
  useEffect(() => {
    if (!sceneRef.current) return;
    const hex = resolveColor(aiDirection.wallColour, "");
    wallMatsRef.current.forEach((m, i) => {
      m.color.set(hex || HARDCODED_ROOMS[i]?.wallColor || "#F5F0E8");
    });
  }, [aiDirection.wallColour]);

  // Floor colour — reset to room defaults when cleared
  useEffect(() => {
    if (!sceneRef.current) return;
    const hex = resolveColor(aiDirection.floorColour, "");
    floorMatsRef.current.forEach((m, i) => {
      m.color.set(hex || HARDCODED_ROOMS[i]?.floorColor || "#C4A882");
    });
  }, [aiDirection.floorColour]);

  // Room selection → camera + visibility
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
      camStateRef.current.target.set(
        lerp(start.target.x, target.target.x, p), 0,
        lerp(start.target.z, target.target.z, p)
      );
      updateCamera();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    sceneRef.current.traverse((obj) => {
      if (obj.userData.roomId !== undefined) {
        obj.visible = selectedRoomId === null || obj.userData.roomId === selectedRoomId;
      }
    });
  }, [selectedRoomId]);

  // Place furniture
  useEffect(() => {
    if (!linkPreview || !sceneRef.current) return;
    if (linkPreview === prevLinkRef.current) return;
    prevLinkRef.current = linkPreview;

    const roomId = selectedRoomId || "living";
    const room = HARDCODED_ROOMS.find((r) => r.id === roomId) || HARDCODED_ROOMS[0];
    const type = (linkPreview as any).type || "other";

  createBillboardFurniture(type, linkPreview.image || "").then((mesh) => {
      if (!sceneRef.current) return;
      mesh.position.set(room.x + room.width / 2, 0, room.y + room.height / 2);
      mesh.userData.roomId = roomId;
      sceneRef.current.add(mesh);
      setPlacedCount((n) => n + 1);
      onItemPlaced?.();
    });
  }, [linkPreview]);

  // Build scene
  useEffect(() => {
    if (!mountRef.current) return;
    wallMatsRef.current = [];
    floorMatsRef.current = [];

    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#f5f0e8");
    scene.fog = new THREE.Fog("#f5f0e8", 30, 80);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff8f0, 0.7));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.camera.left = -15; sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15; sun.shadow.camera.bottom = -15;
    sun.shadow.camera.far = 60;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.4);
    fill.position.set(-8, 10, -5);
    scene.add(fill);

    // Rooms
    HARDCODED_ROOMS.forEach((room) => {
      const wallMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(room.wallColor) });
      const floorMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(room.floorColor) });
      wallMatsRef.current.push(wallMat);
      floorMatsRef.current.push(floorMat);

      const tag = (o: THREE.Object3D) => { o.userData.roomId = room.id; return o; };

      const floor = tag(new THREE.Mesh(new THREE.BoxGeometry(room.width, 0.08, room.height), floorMat));
      (floor as THREE.Mesh).receiveShadow = true;
      floor.position.set(room.x + room.width / 2, -0.04, room.y + room.height / 2);
      scene.add(floor);

      const backWall = tag(new THREE.Mesh(new THREE.BoxGeometry(room.width, WALL_HEIGHT, 0.1), wallMat));
      (backWall as THREE.Mesh).castShadow = true;
      backWall.position.set(room.x + room.width / 2, WALL_HEIGHT / 2, room.y);
      scene.add(backWall);

      const leftWall = tag(new THREE.Mesh(new THREE.BoxGeometry(0.1, WALL_HEIGHT, room.height), wallMat));
      (leftWall as THREE.Mesh).castShadow = true;
      leftWall.position.set(room.x, WALL_HEIGHT / 2, room.y + room.height / 2);
      scene.add(leftWall);

      const c2d = document.createElement("canvas");
      c2d.width = 256; c2d.height = 64;
      const ctx = c2d.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#2d2416"; ctx.font = "bold 20px serif"; ctx.textAlign = "center";
        ctx.fillText(room.name, 128, 38);
      }
      const label = tag(new THREE.Mesh(
        new THREE.PlaneGeometry(room.width * 0.75, 0.5),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2d), transparent: true, side: THREE.DoubleSide })
      ));
      label.position.set(room.x + room.width / 2, 0.05, room.y + room.height / 2);
      label.rotation.x = -Math.PI / 2;
      scene.add(label);
    });

    // Center camera on floor plan centroid
    const initCam = getCameraForRoom(null, w / h);
    camStateRef.current = { theta: initCam.theta, phi: initCam.phi, radius: initCam.radius, target: initCam.target.clone() };
    updateCamera();

    let isDragging = false;
    let prev = { x: 0, y: 0 };
    const onDown = (e: MouseEvent) => { isDragging = true; prev = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      camStateRef.current.theta -= (e.clientX - prev.x) * 0.005;
      camStateRef.current.phi = Math.max(0.15, Math.min(1.45, camStateRef.current.phi + (e.clientY - prev.y) * 0.005));
      prev = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
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
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur whitespace-nowrap">
        {selectedRoomId
          ? <><span className="font-medium text-foreground">{HARDCODED_ROOMS.find(r => r.id === selectedRoomId)?.name}</span> · drag to rotate · scroll to zoom</>
          : <>Overview · drag to rotate · scroll to zoom</>
        }
      </div>
      {placedCount > 0 && (
        <div className="absolute top-3 right-3 rounded-full bg-foreground px-3 py-1 text-[10px] text-background">
          {placedCount} item{placedCount !== 1 ? "s" : ""} placed
        </div>
      )}
    </div>
  );
}