import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface LaptopModelProps {
  scrollProgress: number; // 0.0 to 1.0
  activeComponentId: string | null;
}

export const LaptopModel: React.FC<LaptopModelProps> = ({ scrollProgress }) => {
  const hingeGroupRef = useRef<THREE.Group>(null);
  const laptopRootRef = useRef<THREE.Group>(null);
  const screenMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const chassisCoverRef = useRef<THREE.Group>(null);

  // Dynamic Canvas Texture for the high-end laptop display screen
  const screenTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const renderScreen = (progress: number) => {
      // Screen background: deep tech charcoal
      ctx.fillStyle = '#0a0c0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (progress < 0.22) {
        // Screen off
        ctx.fillStyle = '#050607';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Header Bar
      ctx.fillStyle = '#12151a';
      ctx.fillRect(0, 0, canvas.width, 48);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(canvas.width, 48);
      ctx.stroke();

      // Header Text
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ARCH-VIZ', 28, 30);

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff6a00';
      ctx.fillText('SYS.STATUS // ACTIVE', 140, 30);

      ctx.fillStyle = '#8b949e';
      ctx.fillText('CLOCK: 3.20 GHz | ISA: 32-BIT RISC | CORE: SINGLE PIPELINED', 480, 30);

      // Terminal window left
      ctx.fillStyle = '#0e1116';
      ctx.strokeStyle = 'rgba(255, 106, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(30, 70, 380, 520, 8);
      ctx.fill();
      ctx.stroke();

      // Terminal Header
      ctx.fillStyle = '#161b22';
      ctx.beginPath();
      ctx.roundRect(30, 70, 380, 36, [8, 8, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('DATAPATH TELEMETRY', 45, 93);

      // Terminal content
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ff6a00';
      ctx.fillText('> INITIALIZING CPU VISUALIZER...', 50, 135);
      ctx.fillStyle = '#8b949e';
      ctx.fillText('> REGISTER FILE R0-R31 ALLOCATED', 50, 165);
      ctx.fillText('> ALU: 32-BIT PARALLEL ADDER LOADED', 50, 195);
      ctx.fillText('> INSTRUCTION FETCH UNIT ONLINE', 50, 225);
      ctx.fillText('> L1/L2 CACHE SUBSYSTEM READY', 50, 255);
      
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('> ACTIVE DEMO INSTRUCTION:', 50, 305);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('  ADD R1, R2', 50, 335);

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#8b949e';
      ctx.fillText('  INITIAL STATE:', 50, 370);
      ctx.fillStyle = '#ff6a00';
      ctx.fillText('  R1 = 20 | R2 = 22 | R3 = 0', 50, 395);
      
      ctx.fillStyle = '#8b949e';
      ctx.fillText('  EXPECTED RESULT:', 50, 430);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('  20 + 22 = 42 → R3', 50, 455);

      ctx.fillStyle = 'rgba(255, 106, 0, 0.15)';
      ctx.fillRect(45, 490, 350, 70);
      ctx.strokeStyle = '#ff6a00';
      ctx.strokeRect(45, 490, 350, 70);
      ctx.fillStyle = '#ff6a00';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('EXPLODED TEARDOWN ACTIVE', 60, 520);
      ctx.font = '11px "Inter", sans-serif';
      ctx.fillStyle = '#e6edf3';
      ctx.fillText('Scroll down to isolate silicon blocks in 3D space', 60, 542);

      // Right Side Diagram: Simplified Processor Block Diagram
      ctx.fillStyle = '#0e1116';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(440, 70, 550, 520, 8);
      ctx.fill();
      ctx.stroke();

      // Right Header
      ctx.fillStyle = '#161b22';
      ctx.beginPath();
      ctx.roundRect(440, 70, 550, 36, [8, 8, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('COA HARVARD / RISC ARCHITECTURE SCHEMATIC', 455, 93);

      // Draw interactive architecture blocks on screen
      const drawBlock = (x: number, y: number, w: number, h: number, title: string, subtitle: string, highlight = false) => {
        ctx.fillStyle = highlight ? 'rgba(255, 106, 0, 0.15)' : '#161b22';
        ctx.strokeStyle = highlight ? '#ff6a00' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = highlight ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = highlight ? '#ff6a00' : '#ffffff';
        ctx.font = 'bold 12px "Space Grotesk", sans-serif';
        ctx.fillText(title, x + 12, y + 24);

        ctx.fillStyle = '#8b949e';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(subtitle, x + 12, y + 42);
      };

      // Draw connection line
      const drawBus = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.strokeStyle = 'rgba(255, 106, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Blocks
      drawBlock(470, 130, 150, 60, 'PROGRAM COUNTER', 'Address Register', true);
      drawBlock(670, 130, 150, 60, 'INSTRUCTION REG', 'Opcode Latch');
      drawBlock(850, 130, 120, 60, 'CONTROL UNIT', 'Finite State Logic', true);

      drawBus(620, 160, 670, 160);
      drawBus(820, 160, 850, 160);

      drawBlock(470, 240, 200, 80, 'REGISTER FILE', 'R0-R31 [Dual Read / 1 Write]');
      drawBlock(720, 240, 240, 80, 'ARITHMETIC LOGIC UNIT', '32-Bit Parallel Adder / Logic', true);

      drawBus(670, 280, 720, 280);

      drawBlock(470, 370, 220, 70, 'L1/L2 CACHE', 'SRAM Cache Subsystem');
      drawBlock(730, 370, 230, 70, 'MAIN MEMORY', 'DRAM Instruction & Data');

      drawBus(690, 405, 730, 405);

      drawBlock(470, 470, 490, 90, 'PIPELINE CONTROLLER', '5-Stage Synchronous Pipeline: IF → ID → EX → MEM → WB', true);
    };

    renderScreen(0.4);
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    (texture as any)._updateCanvas = renderScreen;
    (texture as any)._canvas = canvas;
    return texture;
  }, []);

  // Frame update driven by scroll timeline
  useFrame(() => {
    // 1. Laptop Root Orientation & Orbit
    // 0.0 -> 0.12: Closed laptop, 3/4 cinematic angle
    // 0.12 -> 0.25: Rotates forward to face camera
    if (laptopRootRef.current) {
      if (scrollProgress < 0.12) {
        laptopRootRef.current.rotation.y = -0.45;
        laptopRootRef.current.rotation.x = 0.05;
        laptopRootRef.current.position.y = 0;
      } else if (scrollProgress < 0.35) {
        const t = (scrollProgress - 0.12) / (0.35 - 0.12);
        // Smooth ease
        const ease = t * t * (3 - 2 * t);
        laptopRootRef.current.rotation.y = -0.45 + (0.45 * ease);
        laptopRootRef.current.rotation.x = 0.05 - (0.05 * ease);
        laptopRootRef.current.position.y = 0;
      } else if (scrollProgress < 0.55) {
        // Entering laptop
        laptopRootRef.current.rotation.y = 0;
        laptopRootRef.current.rotation.x = 0;
      }
    }

    // 2. Lid Opening around Hinge (0.12 -> 0.35)
    // Closed angle = 0, fully open angle = ~112 degrees (1.95 rad)
    if (hingeGroupRef.current) {
      if (scrollProgress <= 0.12) {
        hingeGroupRef.current.rotation.x = 0; // Lid shut
      } else if (scrollProgress < 0.35) {
        const t = (scrollProgress - 0.12) / (0.35 - 0.12);
        const ease = t * t * (3 - 2 * t);
        hingeGroupRef.current.rotation.x = -1.95 * ease;
      } else {
        hingeGroupRef.current.rotation.x = -1.95; // Fully open
      }
    }

    // 3. Screen Activation & Illumination (0.25 -> 0.40)
    if (screenMaterialRef.current) {
      if (scrollProgress < 0.22) {
        screenMaterialRef.current.emissiveIntensity = 0.0;
      } else if (scrollProgress < 0.38) {
        const t = (scrollProgress - 0.22) / (0.38 - 0.22);
        screenMaterialRef.current.emissiveIntensity = t * 1.4;
      } else {
        screenMaterialRef.current.emissiveIntensity = 1.4;
      }
    }

    // 4. Chassis Keyboard Deck Disassembly / Retraction (0.40 -> 0.55)
    // Reveals the motherboard & CPU socket underneath
    if (chassisCoverRef.current) {
      if (scrollProgress < 0.40) {
        chassisCoverRef.current.position.y = 0;
        chassisCoverRef.current.scale.set(1, 1, 1);
        (chassisCoverRef.current as any).visible = true;
      } else if (scrollProgress < 0.58) {
        const t = (scrollProgress - 0.40) / (0.58 - 0.40);
        // Slides forward and dissolves
        chassisCoverRef.current.position.y = -t * 0.4;
        chassisCoverRef.current.position.z = t * 1.2;
        const scaleVal = Math.max(0.001, 1 - t * 0.8);
        chassisCoverRef.current.scale.set(scaleVal, scaleVal, scaleVal);
        (chassisCoverRef.current as any).visible = t < 0.95;
      } else {
        (chassisCoverRef.current as any).visible = false;
      }
    }
  });

  return (
    <group ref={laptopRootRef} position={[0, 0, 0]}>
      {/* =================================================== */}
      {/* 1. LAPTOP BASE CHASSIS (CNC Graphite Aluminum)     */}
      {/* =================================================== */}
      <group position={[0, -0.09, 0]}>
        {/* Main Base Body */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[4.8, 0.16, 3.2]} />
          <meshStandardMaterial
            color="#14171a"
            metalness={0.88}
            roughness={0.24}
          />
        </mesh>

        {/* Chamfered Base Bottom Plate */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[4.65, 0.02, 3.05]} />
          <meshStandardMaterial
            color="#0c0e10"
            metalness={0.92}
            roughness={0.2}
          />
        </mesh>

        {/* Rubber Feet */}
        <mesh position={[-2.1, -0.09, -1.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshBasicMaterial color="#08090a" />
        </mesh>
        <mesh position={[2.1, -0.09, -1.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshBasicMaterial color="#08090a" />
        </mesh>
        <mesh position={[-2.1, -0.09, 1.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshBasicMaterial color="#08090a" />
        </mesh>
        <mesh position={[2.1, -0.09, 1.3]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshBasicMaterial color="#08090a" />
        </mesh>
      </group>

      {/* =================================================== */}
      {/* 2. CHASSIS TOP COVER & KEYBOARD DECK (Retractable)  */}
      {/* =================================================== */}
      <group ref={chassisCoverRef} position={[0, 0, 0]}>
        {/* Top Deck Surface with Keyboard Well */}
        <mesh castShadow receiveShadow position={[0, 0.005, 0]}>
          <boxGeometry args={[4.76, 0.03, 3.16]} />
          <meshStandardMaterial
            color="#181b20"
            metalness={0.85}
            roughness={0.28}
          />
        </mesh>

        {/* Keyboard Well Inset */}
        <mesh position={[0, 0.02, -0.35]}>
          <boxGeometry args={[4.0, 0.005, 1.8]} />
          <meshStandardMaterial
            color="#0d0f12"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>

        {/* Keyboard Keycaps Array (Procedural Rows) */}
        {[-0.95, -0.65, -0.35, -0.05, 0.25].map((zRow, rowIndex) => (
          <group key={`row-${rowIndex}`} position={[0, 0.03, zRow]}>
            {/* 14 chiclet keys per row */}
            {Array.from({ length: 14 }).map((_, keyIndex) => {
              const isSpace = rowIndex === 4 && keyIndex >= 4 && keyIndex <= 9;
              if (rowIndex === 4 && (keyIndex > 4 && keyIndex <= 9)) return null; // Combined spacebar
              const keyWidth = isSpace ? 1.6 : 0.23;
              const xPos = isSpace ? 0 : -1.8 + keyIndex * 0.28;
              return (
                <mesh key={`key-${keyIndex}`} position={[xPos, 0, 0]}>
                  <boxGeometry args={[keyWidth, 0.02, 0.22]} />
                  <meshStandardMaterial
                    color="#14161a"
                    metalness={0.4}
                    roughness={0.6}
                  />
                </mesh>
              );
            })}
          </group>
        ))}

        {/* Glass Precision Trackpad */}
        <mesh position={[0, 0.02, 0.95]}>
          <boxGeometry args={[1.7, 0.005, 1.05]} />
          <meshStandardMaterial
            color="#121418"
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        {/* Trackpad subtle border chamfer */}
        <mesh position={[0, 0.021, 0.95]}>
          <ringGeometry args={[0.82, 0.84, 4]} />
          <meshBasicMaterial color="#282c34" />
        </mesh>
      </group>

      {/* =================================================== */}
      {/* 3. MECHANICAL DUAL HINGE                           */}
      {/* =================================================== */}
      <group position={[0, 0.02, -1.55]}>
        {/* Left Barrel */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[-1.2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.6, 24]} />
          <meshStandardMaterial
            color="#2a2e35"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
        {/* Right Barrel */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[1.2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.6, 24]} />
          <meshStandardMaterial
            color="#2a2e35"
            metalness={0.95}
            roughness={0.15}
          />
        </mesh>
      </group>

      {/* =================================================== */}
      {/* 4. UPPER DISPLAY ASSEMBLY (Pivoting around Hinge)  */}
      {/* =================================================== */}
      <group ref={hingeGroupRef} position={[0, 0.02, -1.55]}>
        {/* Offset group to position screen lid along the hinge pivot */}
        <group position={[0, 0.04, 1.55]}>
          {/* Display Outer Aluminum Lid */}
          <mesh castShadow receiveShadow position={[0, 0.04, -0.02]}>
            <boxGeometry args={[4.8, 0.07, 3.2]} />
            <meshStandardMaterial
              color="#131518"
              metalness={0.9}
              roughness={0.22}
            />
          </mesh>

          {/* Display Lid Bezel (Inner dark frame) */}
          <mesh position={[0, -0.001, 0]}>
            <boxGeometry args={[4.72, 0.005, 3.12]} />
            <meshStandardMaterial
              color="#07080a"
              metalness={0.3}
              roughness={0.8}
            />
          </mesh>

          {/* Ultra-High Definition Screen Display Mesh */}
          <mesh position={[0, -0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 2.9]} />
            <meshStandardMaterial
              ref={screenMaterialRef}
              color="#ffffff"
              map={screenTexture || undefined}
              emissive="#ffffff"
              emissiveMap={screenTexture || undefined}
              emissiveIntensity={0.0}
              roughness={0.1}
              metalness={0.05}
            />
          </mesh>

          {/* Subtle Screen Bezel Logo */}
          <mesh position={[0, -0.005, 1.5]}>
            <boxGeometry args={[0.4, 0.002, 0.04]} />
            <meshBasicMaterial color="#ff6a00" />
          </mesh>
        </group>
      </group>
    </group>
  );
};
