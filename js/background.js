/**
 * Omnivore - Atmospheric 3D Parallax Background System (Three.js Microcosm)
 * Renders 3 true 3D negative-Z parallax layers (far nebula orbs, mid spores, near marine snow),
 * liquid-refracted fluid coordinate grid, and glowing world boundary barrier rings.
 */

import { Vector2D, randomRange, hsla } from "./math.js";

function createCircleTexture() {
  const THREE = window.THREE;
  if (!THREE) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.25, "rgba(255, 255, 255, 0.85)");
  grad.addColorStop(0.65, "rgba(255, 255, 255, 0.25)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export class BackgroundSystem {
  constructor(worldRadius = 3500) {
    this.worldRadius = worldRadius;

    // Three.js Systems
    this.circleTexture = createCircleTexture();

    // 3D Parallax Layer Objects
    this.farBokehData = [];
    this.farBokehPoints = null;

    this.midSporesData = [];
    this.midSporesPoints = null;

    this.nearSnowData = [];
    this.nearSnowPoints = null;

    // 3D Fluid Coordinate Grid
    this.gridMesh = null;
    this.gridNodesMesh = null;
    this.gridSpacing = 160;

    // 3D World Boundary Barrier Rings
    this.boundaryGroup = null;
    this.innerRingMesh = null;
    this.outerRingMesh = null;

    // Lighting references
    this.ambientLight = null;
    this.dirLight = null;
  }

  initThreeScene(scene) {
    const THREE = window.THREE;
    if (!THREE || !scene) return;

    // 1. Deep Abyssal Fog & Void Background
    scene.background = new THREE.Color(0x020005);
    scene.fog = new THREE.FogExp2(0x030108, 0.00065);

    // 2. Global Microscopic Lighting
    this.ambientLight = new THREE.AmbientLight(0x180828, 0.55);
    scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xa855f7, 0.45);
    this.dirLight.position.set(300, 600, 500);
    scene.add(this.dirLight);

    // 3. Layer 1: Far Nebula Bokeh Orbs (Z: -450 to -650)
    this.initFarBokeh(scene);

    // 4. Layer 2: Mid-Depth Spores & Organelles (Z: -180 to -320)
    this.initMidSpores(scene);

    // 5. Layer 3: Near Marine Snow & Plankton Motes (Z: -30 to -120)
    this.initNearSnow(scene);

    // 6. Fluid Coordinate Grid
    this.initFluidGrid(scene);

    // 7. World Boundary Barrier Rings
    this.initBoundaryRings(scene);
  }

  initFarBokeh(scene) {
    const THREE = window.THREE;
    const count = 70;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldRadius, this.worldRadius);
      const y = randomRange(-this.worldRadius, this.worldRadius);
      const z = randomRange(-650, -450);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const hue = Math.random() > 0.4 ? randomRange(270, 305) : randomRange(105, 135);
      const c = new THREE.Color().setHSL(hue / 360, 0.9, 0.6);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.farBokehData.push({
        vx: randomRange(-0.15, 0.15),
        vy: randomRange(-0.15, 0.15),
        pulseSpeed: randomRange(0.01, 0.025),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 130,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.38,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.farBokehPoints = new THREE.Points(geo, mat);
    scene.add(this.farBokehPoints);
  }

  initMidSpores(scene) {
    const THREE = window.THREE;
    const count = 150;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldRadius, this.worldRadius);
      const y = randomRange(-this.worldRadius, this.worldRadius);
      const z = randomRange(-320, -180);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const hue = Math.random() > 0.5 ? randomRange(110, 135) : randomRange(265, 295);
      const c = new THREE.Color().setHSL(hue / 360, 0.95, 0.65);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.midSporesData.push({
        vx: randomRange(-0.35, 0.35),
        vy: randomRange(-0.35, 0.35),
        pulseSpeed: randomRange(0.02, 0.04),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 32,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.55,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.midSporesPoints = new THREE.Points(geo, mat);
    scene.add(this.midSporesPoints);
  }

  initNearSnow(scene) {
    const THREE = window.THREE;
    const count = 300;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = randomRange(-this.worldRadius, this.worldRadius);
      const y = randomRange(-this.worldRadius, this.worldRadius);
      const z = randomRange(-120, -30);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const hue = Math.random() > 0.35 ? randomRange(100, 135) : randomRange(270, 295);
      const c = new THREE.Color().setHSL(hue / 360, 1.0, 0.75);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.nearSnowData.push({
        vx: randomRange(-0.25, 0.25),
        vy: randomRange(-0.25, 0.25),
        flickerSpeed: randomRange(0.03, 0.07),
        flickerPhase: Math.random() * Math.PI * 2
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 7,
      map: this.circleTexture,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.nearSnowPoints = new THREE.Points(geo, mat);
    scene.add(this.nearSnowPoints);
  }

  initFluidGrid(scene) {
    const THREE = window.THREE;
    // Dynamic grid line segments centered around the viewport
    // 24 horizontal and 24 vertical lines with 12 segments each
    const linesCount = 24;
    const segsPerLine = 12;
    const totalVerts = (linesCount * 2) * (segsPerLine * 2);
    const pos = new Float32Array(totalVerts * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.LineBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.gridMesh = new THREE.LineSegments(geo, mat);
    scene.add(this.gridMesh);

    // Grid coordinate intersection nodes
    const nodeCount = linesCount * linesCount;
    const nodePos = new Float32Array(nodeCount * 3);
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));

    const nodeMat = new THREE.PointsMaterial({
      size: 5,
      map: this.circleTexture,
      color: 0x39ff14,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.gridNodesMesh = new THREE.Points(nodeGeo, nodeMat);
    scene.add(this.gridNodesMesh);
  }

  initBoundaryRings(scene) {
    const THREE = window.THREE;
    this.boundaryGroup = new THREE.Group();

    // Inner Toxic Green Ring
    const innerGeo = new THREE.RingGeometry(this.worldRadius - 4, this.worldRadius + 4, 128);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.innerRingMesh = new THREE.Mesh(innerGeo, innerMat);
    this.innerRingMesh.position.set(0, 0, 0.5);
    this.boundaryGroup.add(this.innerRingMesh);

    // Outer Alien Purple Ring
    const outerGeo = new THREE.RingGeometry(this.worldRadius + 22, this.worldRadius + 28, 128);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.outerRingMesh = new THREE.Mesh(outerGeo, outerMat);
    this.outerRingMesh.position.set(0, 0, 0.4);
    this.boundaryGroup.add(this.outerRingMesh);

    scene.add(this.boundaryGroup);
  }

  update(dt = 1, camX = 0, camY = 0) {
    const wrapRadius = 2600;

    // 1. Update Far Bokeh Points
    if (this.farBokehPoints) {
      const pos = this.farBokehPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.farBokehData.length; i++) {
        const d = this.farBokehData[i];
        let x = pos[i * 3] + d.vx * dt;
        let y = pos[i * 3 + 1] + d.vy * dt;

        // Wrap around camera
        if (x - camX > wrapRadius) x -= wrapRadius * 2;
        else if (x - camX < -wrapRadius) x += wrapRadius * 2;
        if (y - camY > wrapRadius) y -= wrapRadius * 2;
        else if (y - camY < -wrapRadius) y += wrapRadius * 2;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        d.pulsePhase += d.pulseSpeed * dt;
      }
      this.farBokehPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Mid Spores Points
    if (this.midSporesPoints) {
      const pos = this.midSporesPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.midSporesData.length; i++) {
        const d = this.midSporesData[i];
        let x = pos[i * 3] + d.vx * dt;
        let y = pos[i * 3 + 1] + d.vy * dt;

        if (x - camX > wrapRadius) x -= wrapRadius * 2;
        else if (x - camX < -wrapRadius) x += wrapRadius * 2;
        if (y - camY > wrapRadius) y -= wrapRadius * 2;
        else if (y - camY < -wrapRadius) y += wrapRadius * 2;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        d.pulsePhase += d.pulseSpeed * dt;
      }
      this.midSporesPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Near Snow Points
    if (this.nearSnowPoints) {
      const pos = this.nearSnowPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.nearSnowData.length; i++) {
        const d = this.nearSnowData[i];
        let x = pos[i * 3] + d.vx * dt;
        let y = pos[i * 3 + 1] + d.vy * dt;

        if (x - camX > wrapRadius) x -= wrapRadius * 2;
        else if (x - camX < -wrapRadius) x += wrapRadius * 2;
        if (y - camY > wrapRadius) y -= wrapRadius * 2;
        else if (y - camY < -wrapRadius) y += wrapRadius * 2;

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        d.flickerPhase += d.flickerSpeed * dt;
      }
      this.nearSnowPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Undulate Dynamic Fluid Coordinate Grid around camera
    if (this.gridMesh && this.gridNodesMesh) {
      this.updateFluidGrid(camX, camY);
    }

    // 5. Pulsate Boundary Barrier Rings
    if (this.innerRingMesh && this.outerRingMesh) {
      const time = performance.now() * 0.0018;
      const pulseScale = 1 + Math.sin(time * 2) * 0.003;
      this.innerRingMesh.scale.set(pulseScale, pulseScale, 1);
      this.outerRingMesh.scale.set(pulseScale, pulseScale, 1);
    }
  }

  updateFluidGrid(camX, camY) {
    const spacing = this.gridSpacing;
    const linesCount = 24;
    const segsPerLine = 12;
    const halfSpan = (linesCount * spacing) * 0.5;

    const startX = Math.floor((camX - halfSpan) / spacing) * spacing;
    const startY = Math.floor((camY - halfSpan) / spacing) * spacing;

    const linePos = this.gridMesh.geometry.attributes.position.array;
    const nodePos = this.gridNodesMesh.geometry.attributes.position.array;
    const time = performance.now() * 0.0012;

    let pIdx = 0;
    let nIdx = 0;
    const segStep = (linesCount * spacing) / segsPerLine;

    // Vertical undulating lines
    for (let c = 0; c < linesCount; c++) {
      const gx = startX + c * spacing;
      for (let s = 0; s < segsPerLine; s++) {
        const y1 = startY + s * segStep;
        const y2 = startY + (s + 1) * segStep;

        const waveX1 = gx + Math.sin(y1 * 0.007 + time * 1.3 + gx * 0.002) * 6;
        const waveX2 = gx + Math.sin(y2 * 0.007 + time * 1.3 + gx * 0.002) * 6;

        linePos[pIdx++] = waveX1;
        linePos[pIdx++] = y1;
        linePos[pIdx++] = -5;

        linePos[pIdx++] = waveX2;
        linePos[pIdx++] = y2;
        linePos[pIdx++] = -5;
      }
    }

    // Horizontal undulating lines
    for (let r = 0; r < linesCount; r++) {
      const gy = startY + r * spacing;
      for (let s = 0; s < segsPerLine; s++) {
        const x1 = startX + s * segStep;
        const x2 = startX + (s + 1) * segStep;

        const waveY1 = gy + Math.sin(x1 * 0.007 + time * 1.3 + gy * 0.002) * 6;
        const waveY2 = gy + Math.sin(x2 * 0.007 + time * 1.3 + gy * 0.002) * 6;

        linePos[pIdx++] = x1;
        linePos[pIdx++] = waveY1;
        linePos[pIdx++] = -5;

        linePos[pIdx++] = x2;
        linePos[pIdx++] = waveY2;
        linePos[pIdx++] = -5;
      }
    }

    // Grid Intersection Nodes
    for (let c = 0; c < linesCount; c++) {
      const gx = startX + c * spacing;
      for (let r = 0; r < linesCount; r++) {
        const gy = startY + r * spacing;
        const nx = gx + Math.sin(gy * 0.007 + time * 1.3 + gx * 0.002) * 6;
        const ny = gy + Math.sin(gx * 0.007 + time * 1.3 + gy * 0.002) * 6;

        nodePos[nIdx++] = nx;
        nodePos[nIdx++] = ny;
        nodePos[nIdx++] = -4.5;
      }
    }

    this.gridMesh.geometry.attributes.position.needsUpdate = true;
    this.gridNodesMesh.geometry.attributes.position.needsUpdate = true;
  }

  // Fallback 2D Canvas methods
  render(ctx, camera, viewWidth, viewHeight) {}
  renderWorldGrid(ctx, camera, viewWidth, viewHeight) {}
}
