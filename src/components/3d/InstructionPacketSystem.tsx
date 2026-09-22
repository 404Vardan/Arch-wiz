import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ExecutionStage, ComponentId } from '../../types';

interface InstructionPacketSystemProps {
  currentStageIndex: number;
  scrollProgress: number;
  isPlaying: boolean;
}

interface PacketTrail {
  headMesh: THREE.Mesh;
  trailPoints: THREE.Points;
  curve: THREE.CatmullRomCurve3;
  progress: number;
  speed: number;
  color: string;
  label?: string;
}

export const InstructionPacketSystem: React.FC<InstructionPacketSystemProps> = ({
  currentStageIndex,
  scrollProgress,
  isPlaying
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Reusable vectors to avoid allocations in useFrame
  const tempVecA = useMemo(() => new THREE.Vector3(), []);
  const tempVecB = useMemo(() => new THREE.Vector3(), []);
  const tempVecMid = useMemo(() => new THREE.Vector3(), []);

  // Calculate explosion factor for positioning
  const explosionFactor = Math.max(0, Math.min(1, (scrollProgress - 0.45) / (0.68 - 0.45)));
  const easedExplosion = explosionFactor * explosionFactor * (3 - 2 * explosionFactor);

  // Helper to get component world coordinate at current explosion factor
  const getCompPos = (id: ComponentId, offset = [0, 0, 0]): [number, number, number] => {
    const comp = CPU_COMPONENTS[id];
    if (!comp) return [0, 0, 0];
    const x = comp.position[0] + (comp.explodedPosition[0] - comp.position[0]) * easedExplosion + offset[0];
    const y = comp.position[1] + (comp.explodedPosition[1] - comp.position[1]) * easedExplosion + offset[1];
    const z = comp.position[2] + (comp.explodedPosition[2] - comp.position[2]) * easedExplosion + offset[2];
    return [x, y, z];
  };

  // Packet animation state
  const packetState = useRef({
    t: 0,
    subStage: 0, // 0 or 1 for multi-phase stages like FETCH (PC->Mem then Mem->IR)
    lastStageIndex: -1
  });

  // Mesh and point references
  const packetHeadRef1 = useRef<THREE.Mesh>(null);
  const packetHeadRef2 = useRef<THREE.Mesh>(null); // For dual operand read in Stage 2
  const busLineRef = useRef<THREE.Line>(null);

  // Number of trail particles per packet
  const TRAIL_LENGTH = 8;
  const trailPositions1 = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), []);
  const trailPositions2 = useMemo(() => new Float32Array(TRAIL_LENGTH * 3), []);
  const trailPointsRef1 = useRef<THREE.Points>(null);
  const trailPointsRef2 = useRef<THREE.Points>(null);

  // Pre-allocated curve sample points
  const CURVE_POINTS = 30;
  const busPositions = useMemo(() => new Float32Array(CURVE_POINTS * 3), []);

  useFrame((_, delta) => {
    // Only animate if exploded architecture is visible
    if (scrollProgress < 0.55 && !isPlaying) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;

    // Advance packet progress
    const speed = isPlaying ? 1.4 : 0.8;
    packetState.current.t += delta * speed;

    // Reset subStage on stage switch
    if (packetState.current.lastStageIndex !== currentStageIndex) {
      packetState.current.lastStageIndex = currentStageIndex;
      packetState.current.t = 0;
      packetState.current.subStage = 0;
    }

    if (packetState.current.t >= 1) {
      packetState.current.t = 0;
      // Toggle subStage for 2-step stages
      if (currentStageIndex === 0) { // FETCH: PC->MEM then MEM->IR
        packetState.current.subStage = (packetState.current.subStage + 1) % 2;
      }
    }

    const t = packetState.current.t;

    // Determine Source & Destination coordinates for current stage & subStage
    let src1: [number, number, number] = [0, 0, 0];
    let dst1: [number, number, number] = [0, 0, 0];
    let arcHeight1 = 0.35;

    let isDualStream = false;
    let src2: [number, number, number] = [0, 0, 0];
    let dst2: [number, number, number] = [0, 0, 0];
    let arcHeight2 = 0.35;

    let packetColor1 = '#ff6a00';
    let packetColor2 = '#38bdf8';

    switch (currentStageIndex) {
      case 0: // FETCH: PC -> MEM (sub 0), then MEM -> IR (sub 1)
        if (packetState.current.subStage === 0) {
          src1 = getCompPos('PC', [0, 0.12, 0]);
          dst1 = getCompPos('MEMORY', [0, 0.12, 0]);
          packetColor1 = '#38bdf8'; // Cyan instruction address
          arcHeight1 = 0.45;
        } else {
          src1 = getCompPos('MEMORY', [0, 0.12, 0]);
          dst1 = getCompPos('IR', [0, 0.12, 0]);
          packetColor1 = '#a855f7'; // Purple instruction word
          arcHeight1 = 0.4;
        }
        break;

      case 1: // DECODE: IR -> CONTROL UNIT
        src1 = getCompPos('IR', [0, 0.12, 0]);
        dst1 = getCompPos('CU', [0, 0.14, 0]);
        packetColor1 = '#ff6a00'; // Amber opcode
        arcHeight1 = 0.35;
        break;

      case 2: // REGISTER READ: REG_FILE -> ALU (Two parallel streams for x1 and x2)
        isDualStream = true;
        // Stream 1: x1 = 20 (Port A -> ALU Input A)
        src1 = getCompPos('REG_FILE', [-0.15, 0.14, 0.1]);
        dst1 = getCompPos('ALU', [-0.2, 0.16, -0.15]);
        packetColor1 = '#e5a93c'; // Gold operand 1 (x1=20)
        arcHeight1 = 0.25;

        // Stream 2: x2 = 22 (Port B -> ALU Input B)
        src2 = getCompPos('REG_FILE', [0.15, 0.14, 0.1]);
        dst2 = getCompPos('ALU', [0.2, 0.16, -0.15]);
        packetColor2 = '#38bdf8'; // Cyan operand 2 (x2=22)
        arcHeight2 = 0.35;
        break;

      case 3: // EXECUTE: Internal calculation & ALU -> Bus
        src1 = getCompPos('ALU', [0, 0.16, 0]);
        dst1 = getCompPos('ALU', [0, 0.4, 0]); // Pulse upward during calculation
        packetColor1 = '#22c55e'; // Bright green active calculation
        arcHeight1 = 0.2;
        break;

      case 4: // WRITE BACK: ALU -> REG_FILE (Result writeback 42)
        src1 = getCompPos('ALU', [0, 0.16, 0]);
        dst1 = getCompPos('REG_FILE', [0, 0.14, 0]);
        packetColor1 = '#4ade80'; // Emerald result writeback (x3=42)
        arcHeight1 = 0.5;
        break;

      default:
        break;
    }

    // --- Compute 3D Bézier Curve for Packet 1 ---
    tempVecA.set(...src1);
    tempVecB.set(...dst1);
    tempVecMid.lerpVectors(tempVecA, tempVecB, 0.5);
    tempVecMid.y += arcHeight1;

    // Head 1 Position along quadratic curve
    const currentX1 = (1 - t) * (1 - t) * tempVecA.x + 2 * (1 - t) * t * tempVecMid.x + t * t * tempVecB.x;
    const currentY1 = (1 - t) * (1 - t) * tempVecA.y + 2 * (1 - t) * t * tempVecMid.y + t * t * tempVecB.y;
    const currentZ1 = (1 - t) * (1 - t) * tempVecA.z + 2 * (1 - t) * t * tempVecMid.z + t * t * tempVecB.z;

    if (packetHeadRef1.current) {
      packetHeadRef1.current.position.set(currentX1, currentY1, currentZ1);
      (packetHeadRef1.current.material as THREE.MeshBasicMaterial).color.set(packetColor1);
      // Pulsing scale
      const pulse = 1 + Math.sin(t * Math.PI * 4) * 0.15;
      packetHeadRef1.current.scale.set(pulse, pulse, pulse);
    }

    // Trailing particles for Packet 1
    if (trailPointsRef1.current) {
      const posArray = trailPointsRef1.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const trailT = Math.max(0, t - (i + 1) * 0.035);
        posArray[i * 3] = (1 - trailT) * (1 - trailT) * tempVecA.x + 2 * (1 - trailT) * trailT * tempVecMid.x + trailT * trailT * tempVecB.x;
        posArray[i * 3 + 1] = (1 - trailT) * (1 - trailT) * tempVecA.y + 2 * (1 - trailT) * trailT * tempVecMid.y + trailT * trailT * tempVecB.y;
        posArray[i * 3 + 2] = (1 - trailT) * (1 - trailT) * tempVecA.z + 2 * (1 - trailT) * trailT * tempVecMid.z + trailT * trailT * tempVecB.z;
      }
      trailPointsRef1.current.geometry.attributes.position.needsUpdate = true;
      (trailPointsRef1.current.material as THREE.PointsMaterial).color.set(packetColor1);
    }

    // Visual curved bus guide line
    if (busLineRef.current) {
      const linePos = busLineRef.current.geometry.attributes.position.array as Float32Array;
      for (let k = 0; k < CURVE_POINTS; k++) {
        const s = k / (CURVE_POINTS - 1);
        linePos[k * 3] = (1 - s) * (1 - s) * tempVecA.x + 2 * (1 - s) * s * tempVecMid.x + s * s * tempVecB.x;
        linePos[k * 3 + 1] = (1 - s) * (1 - s) * tempVecA.y + 2 * (1 - s) * s * tempVecMid.y + s * s * tempVecB.y;
        linePos[k * 3 + 2] = (1 - s) * (1 - s) * tempVecA.z + 2 * (1 - s) * s * tempVecMid.z + s * s * tempVecB.z;
      }
      busLineRef.current.geometry.attributes.position.needsUpdate = true;
      (busLineRef.current.material as THREE.LineBasicMaterial).color.set(packetColor1);
    }

    // --- Dual stream handling for Stream 2 (e.g. Operand B in Stage 2) ---
    if (packetHeadRef2.current) {
      packetHeadRef2.current.visible = isDualStream;
      if (isDualStream) {
        tempVecA.set(...src2);
        tempVecB.set(...dst2);
        tempVecMid.lerpVectors(tempVecA, tempVecB, 0.5);
        tempVecMid.y += arcHeight2;

        const currentX2 = (1 - t) * (1 - t) * tempVecA.x + 2 * (1 - t) * t * tempVecMid.x + t * t * tempVecB.x;
        const currentY2 = (1 - t) * (1 - t) * tempVecA.y + 2 * (1 - t) * t * tempVecMid.y + t * t * tempVecB.y;
        const currentZ2 = (1 - t) * (1 - t) * tempVecA.z + 2 * (1 - t) * t * tempVecMid.z + t * t * tempVecB.z;

        packetHeadRef2.current.position.set(currentX2, currentY2, currentZ2);
        (packetHeadRef2.current.material as THREE.MeshBasicMaterial).color.set(packetColor2);

        if (trailPointsRef2.current) {
          trailPointsRef2.current.visible = true;
          const posArray2 = trailPointsRef2.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < TRAIL_LENGTH; i++) {
            const trailT = Math.max(0, t - (i + 1) * 0.035);
            posArray2[i * 3] = (1 - trailT) * (1 - trailT) * tempVecA.x + 2 * (1 - trailT) * trailT * tempVecMid.x + trailT * trailT * tempVecB.x;
            posArray2[i * 3 + 1] = (1 - trailT) * (1 - trailT) * tempVecA.y + 2 * (1 - trailT) * trailT * tempVecMid.y + trailT * trailT * tempVecB.y;
            posArray2[i * 3 + 2] = (1 - trailT) * (1 - trailT) * tempVecA.z + 2 * (1 - trailT) * trailT * tempVecMid.z + trailT * trailT * tempVecB.z;
          }
          trailPointsRef2.current.geometry.attributes.position.needsUpdate = true;
          (trailPointsRef2.current.material as THREE.PointsMaterial).color.set(packetColor2);
        }
      } else {
        if (trailPointsRef2.current) trailPointsRef2.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dynamic 3D Curved Datapath Bus Guide */}
      <line ref={busLineRef as any}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[busPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff6a00" transparent opacity={0.35} linewidth={2} />
      </line>

      {/* Packet 1 Head (Glowing Core) */}
      <mesh ref={packetHeadRef1}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshBasicMaterial color="#ff6a00" toneMapped={false} />
      </mesh>

      {/* Packet 1 Trailing Particles */}
      <points ref={trailPointsRef1}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositions1, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#ff6a00"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Packet 2 Head (Dual Stream for Operand B in Stage 2) */}
      <mesh ref={packetHeadRef2} visible={false}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} />
      </mesh>

      {/* Packet 2 Trailing Particles */}
      <points ref={trailPointsRef2} visible={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[trailPositions2, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#38bdf8"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
