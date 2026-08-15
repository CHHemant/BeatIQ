import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { tierColor } from "../utils/riskEngine";

const ROAD_MESHES = [
  { w: 14, h: 0.06, d: 1.6, x: 0, z: -3 },
  { w: 14, h: 0.06, d: 1.6, x: 0, z: 0 },
  { w: 14, h: 0.06, d: 1.6, x: 0, z: 3 },
  { w: 1.6, h: 0.06, d: 10, x: -4, z: 0 },
  { w: 1.6, h: 0.06, d: 10, x: -2, z: 0 },
  { w: 1.6, h: 0.06, d: 10, x: 0, z: 0 },
  { w: 1.6, h: 0.06, d: 10, x: 2, z: 0 },
  { w: 1.6, h: 0.06, d: 10, x: 4, z: 0 },
];

function buildLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 84;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite();

  ctx.fillStyle = "rgba(6, 10, 17, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255, 215, 95, 0.8)";
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  ctx.fillStyle = "#f4efe2";
  ctx.font = "600 26px 'IBM Plex Sans'";
  ctx.fillText(text, 16, 52);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.3, 0.8, 1);
  return sprite;
}

export default function TrafficScene({ locations, selectedId, onSelect, deployedMap, incident, weatherMode }) {
  const mountRef = useRef(null);
  const sceneState = useRef(null);

  const avgTraffic = useMemo(() => {
    if (!locations.length) return 45;
    return locations.reduce((sum, l) => sum + l.trafficScore, 0) / locations.length;
  }, [locations]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0d1220");
    scene.fog = new THREE.Fog("#0d1220", 16, weatherMode.includes("Rain") ? 30 : 38);

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 130);
    camera.position.set(15, 12, 16);
    const target = new THREE.Vector3(0, 0.8, 0);
    camera.lookAt(target);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff3de, 0.6));
    const keyLight = new THREE.DirectionalLight(0xfff6d4, 1);
    keyLight.position.set(8, 12, 5);
    scene.add(keyLight);

    const fill = new THREE.DirectionalLight(0x7ad7ff, 0.45);
    fill.position.set(-8, 8, -6);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 22),
      new THREE.MeshStandardMaterial({ color: 0x1d2532, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    ROAD_MESHES.forEach((r) => {
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(r.w, r.h, r.d),
        new THREE.MeshStandardMaterial({ color: 0x2e2a22, roughness: 0.92 })
      );
      road.position.set(r.x, 0.03, r.z);
      scene.add(road);
    });

    const grid = new THREE.GridHelper(20, 20, 0x665e44, 0x2c3448);
    grid.position.y = 0.04;
    scene.add(grid);

    for (let i = 0; i < 22; i += 1) {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.8 + (i % 3), 1.8 + (i % 5) * 0.55, 0.8 + (i % 2) * 0.6),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x464f65 : 0x5d5870, roughness: 0.85 })
      );
      b.position.set((Math.random() - 0.5) * 18, b.geometry.parameters.height / 2, (Math.random() - 0.5) * 15);
      if (Math.abs(b.position.x) < 5 && Math.abs(b.position.z) < 4) continue;
      scene.add(b);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const columns = {};
    const rings = {};
    const police = {};
    const labels = {};

    locations.forEach((location) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.06, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0xffcb58, emissive: 0x332200 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(location.x, 0.07, location.z);
      scene.add(ring);
      rings[location.id] = ring;

      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.46, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: 0xb7ef5a, roughness: 0.45, metalness: 0.15 })
      );
      column.position.set(location.x, 0.6, location.z);
      column.userData.id = location.id;
      scene.add(column);
      columns[location.id] = column;

      const policeUnit = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x5eb3ff, emissive: 0x07294c })
      );
      policeUnit.position.set(location.x + 0.6, 0.18, location.z - 0.4);
      scene.add(policeUnit);
      police[location.id] = policeUnit;

      const label = buildLabel(location.name);
      label.position.set(location.x, 2.1, location.z);
      scene.add(label);
      labels[location.id] = label;

      const signalPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 0.75, 8),
        new THREE.MeshStandardMaterial({ color: 0x242a39 })
      );
      signalPole.position.set(location.x - 0.5, 0.38, location.z + 0.5);
      scene.add(signalPole);

      const signalLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x2ad264, emissive: 0x0a551f })
      );
      signalLight.position.set(location.x - 0.5, 0.8, location.z + 0.5);
      signalLight.userData.base = Math.random() * Math.PI * 2;
      scene.add(signalLight);
      labels[`${location.id}-signal`] = signalLight;
    });

    const trafficCount = Math.max(8, Math.round(avgTraffic / 7));
    const cars = [];
    for (let i = 0; i < trafficCount; i += 1) {
      const car = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.14, 0.2),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf8c04c : 0xff6948 })
      );
      car.position.set(-6 + (i % 10), 0.15, i % 2 ? -3 : 0);
      car.userData = {
        lane: i % 3,
        speed: 0.015 + (i % 5) * 0.003,
        offset: i * 0.9,
      };
      scene.add(car);
      cars.push(car);
    }

    const incidentRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.09, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0xff3a2a, emissive: 0x5f0905, transparent: true, opacity: 0 })
    );
    incidentRing.rotation.x = Math.PI / 2;
    scene.add(incidentRing);

    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    function onClick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(Object.values(columns));
      if (hits.length) {
        onSelect(hits[0].object.userData.id);
      }
    }

    let dragging = false;
    let lx = 0;
    let ly = 0;
    let azimuth = 0.6;
    let elevation = 0.6;
    const radius = 19;

    function applyCamera() {
      camera.position.set(
        target.x + radius * Math.sin(azimuth) * Math.cos(elevation),
        target.y + radius * Math.sin(elevation),
        target.z + radius * Math.cos(azimuth) * Math.cos(elevation)
      );
      camera.lookAt(target);
    }

    function onDown(event) {
      dragging = true;
      lx = event.clientX;
      ly = event.clientY;
    }

    function onUp() {
      dragging = false;
    }

    function onMove(event) {
      if (!dragging) return;
      azimuth += (event.clientX - lx) * 0.005;
      elevation = Math.max(0.2, Math.min(1.2, elevation - (event.clientY - ly) * 0.004));
      lx = event.clientX;
      ly = event.clientY;
      applyCamera();
    }

    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", onResize);

    sceneState.current = {
      scene,
      camera,
      renderer,
      mount,
      columns,
      rings,
      police,
      labels,
      incidentRing,
      cars,
      target,
      selectedRef: selectedId,
      raf: 0,
    };

    let t = 0;
    const animate = () => {
      t += 0.016;
      if (!dragging) {
        azimuth += 0.0009;
        applyCamera();
      }

      cars.forEach((car, i) => {
        const laneZ = car.userData.lane === 0 ? -3 : car.userData.lane === 1 ? 0 : 3;
        const span = 12;
        const x = ((t * (car.userData.speed * 40) + car.userData.offset) % span) - span / 2;
        car.position.set(x * 1.1, 0.15, laneZ + (i % 2 ? 0 : 0.25));
      });

      Object.values(labels)
        .filter((item) => item.type === "Mesh" && item.geometry.type === "SphereGeometry")
        .forEach((signal, idx) => {
          const pulse = Math.sin(t * 2 + idx) * 0.5 + 0.5;
          const color = pulse > 0.66 ? 0x24cf56 : pulse > 0.33 ? 0xf4bc40 : 0xee4c3c;
          signal.material.color.setHex(color);
          signal.material.emissive.setHex(color);
        });

      renderer.render(scene, camera);
      sceneState.current.raf = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (!sceneState.current) return;
      cancelAnimationFrame(sceneState.current.raf);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      sceneState.current = null;
    };
  }, []);

  useEffect(() => {
    const state = sceneState.current;
    if (!state) return;

    locations.forEach((location) => {
      const column = state.columns[location.id];
      const ring = state.rings[location.id];
      const police = state.police[location.id];
      if (!column || !ring || !police) return;

      const height = Math.max(0.5, location.finalRiskScore / 15);
      column.scale.y = height;
      column.position.y = 0.3 + (height - 1) * 0.5;
      column.material.color.set(tierColor(location.finalRiskScore));
      column.material.emissive.set(location.finalRiskScore >= 85 ? "#702012" : "#0d0f16");

      ring.material.color.set(selectedId === location.id ? "#f4f1dd" : "#f5c14b");
      ring.scale.setScalar(selectedId === location.id ? 1.25 : 1);

      const deployed = deployedMap[location.id] || 0;
      police.visible = deployed > 0;
      police.scale.setScalar(0.9 + deployed * 0.25);
      police.material.color.set(deployed > 2 ? "#56f0d0" : "#5eb3ff");

      if (incident?.locationId === location.id) {
        state.incidentRing.position.set(location.x, 0.14, location.z);
        state.incidentRing.material.opacity = 0.85;
        const pulse = (Math.sin(Date.now() * 0.008) + 2.4) / 2;
        state.incidentRing.scale.setScalar(pulse);
      }
    });

    if (!incident) {
      state.incidentRing.material.opacity = 0;
    }

    const selected = locations.find((location) => location.id === selectedId);
    if (selected) {
      state.target.lerp(new THREE.Vector3(selected.x, 0.6, selected.z), 0.1);
    }
  }, [locations, selectedId, deployedMap, incident]);

  return <div ref={mountRef} className="traffic-scene" aria-label="3D Traffic Command Scene" />;
}
