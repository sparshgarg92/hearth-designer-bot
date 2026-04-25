import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useRoomSession } from "@/lib/room-session";

const WALL_HEIGHT = 2.8;

function resolveColor(input: string, fallback: string): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (/^#[0-9a-f]{3,6}$/i.test(trimmed)) return trimmed;
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return fallback;
  c.fillStyle = "#123456";
  c.fillStyle = trimmed;
  if (c.fillStyle === "#123456") return fallback;
  return c.fillStyle;
}

export function RoomStage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { generatedImage, imageAdjust, aiDirection } = useRoomSession();
  const [rooms, setRooms] = useState<any[]>([]);
  const wallMatsRef = useRef<THREE.MeshLambertMaterial[]>([]);
  const floorMatsRef = useRef<THREE.MeshLambertMaterial[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("roomData");
    if (raw) {
      const data = JSON.parse(raw);
      setRooms(data.rooms || []);
    }
  }, []);

  useEffect(() => {
    if (aiDirection.wallColour) {
      const hex = resolveColor(aiDirection.wallColour, "");
      if (hex) wallMatsRef.current.forEach(m => m.color.set(hex));
    }
  }, [aiDirection.wallColour]);

  useEffect(() => {
    if (aiDirection.floorColour) {
      const hex = resolveColor(aiDirection.floorColour, "");
      if (hex) floorMatsRef.current.forEach(m => m.color.set(hex));
    }
  }, [aiDirection.floorColour]);

  useEffect(() => {
    if (!mountRef.current) return;
    wallMatsRef.current = [];
    floorMatsRef.current = [];
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f5f0e8");
    scene.fog = new THREE.Fog("#f5f0e8", 20, 60);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xfff8f0, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    scene.add(sun);

    const roomsToRender = rooms.length > 0 ? rooms : [
      { id: "r1", name: "Living Room", type: "living", x: 0, y: 0, width: 6, height: 5, wallColor: "#F5F0E8", floorColor: "#C4A882" },
      { id: "r2", name: "Kitchen", type: "kitchen", x: 6, y: 0, width: 4, height: 5, wallColor: "#EEF0E8", floorColor: "#B8A878" },
      { id: "r3", name: "Bedroom", type: "bedroom", x: 0, y: 5, width: 5, height: 4, wallColor: "#E8EEF0", floorColor: "#A89878" },
    ];

    const centerX = roomsToRender.reduce((s, r) => s + r.x + r.width / 2, 0) / roomsToRender.length;
    const centerZ = roomsToRender.reduce((s, r) => s + r.y + r.height / 2, 0) / roomsToRender.length;

    roomsToRender.forEach((room) => {
      const wallHex = resolveColor(aiDirection.wallColour, room.wallColor || "#F5F0E8");
      const floorHex = resolveColor(aiDirection.floorColour, room.floorColor || "#C4A882");

      const wallMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(wallHex) });
      const floorMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(floorHex) });
      wallMatsRef.current.push(wallMat);
      floorMatsRef.current.push(floorMat);

      const floor = new THREE.Mesh(new THREE.BoxGeometry(room.width, 0.1, room.height), floorMat);
      floor.position.set(room.x + room.width / 2, -0.05, room.y + room.height / 2);
      floor.receiveShadow = true;
      scene.add(floor);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(room.width, WALL_HEIGHT, 0.15), wallMat);
      backWall.position.set(room.x + room.width / 2, WALL_HEIGHT / 2, room.y);
      scene.add(backWall);

      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, WALL_HEIGHT, room.height), wallMat);
      leftWall.position.set(room.x, WALL_HEIGHT / 2, room.y + room.height / 2);
      scene.add(leftWall);

      const c2d = document.createElement("canvas");
      c2d.width = 256; c2d.height = 64;
      const ctx = c2d.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#2d2416";
        ctx.font = "bold 22px serif";
        ctx.textAlign = "center";
        ctx.fillText(room.name, 128, 40);
      }
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(room.width * 0.8, 0.6),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2d), transparent: true, side: THREE.DoubleSide })
      );
      label.position.set(room.x + room.width / 2, 0.1, room.y + room.height / 2);
      label.rotation.x = -Math.PI / 2;
      scene.add(label);
    });

    let theta = 0.8, phi = 0.9, radius = 22;
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    const target = new THREE.Vector3(centerX, 0, centerZ);

    const updateCamera = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    };
    updateCamera();

    const onDown = (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      theta -= (e.clientX - prevMouse.x) * 0.005;
      phi = Math.max(0.2, Math.min(1.4, phi + (e.clientY - prevMouse.y) * 0.005));
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => { radius = Math.max(8, Math.min(40, radius + e.deltaY * 0.02)); updateCamera(); };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    renderer.domElement.addEventListener("wheel", onWheel);

    let animId: number;
    const animate = () => { animId = requestAnimationFrame(animate); renderer.render(scene, camera); };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth, nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [rooms, aiDirection.wallColour, aiDirection.floorColour]);

  if (generatedImage) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
        <img src={generatedImage} alt="AI generated room"
          className="animate-fade-in h-full w-full object-cover"
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}