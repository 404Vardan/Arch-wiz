import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { LaptopModel } from './LaptopModel';
import { CPUArchitecture } from './CPUArchitecture';
import { DataFlowParticles } from './DataFlowParticles';
import { ComponentId, ExecutionStage } from '../../types';
import { scrollStore } from '../../stores/scrollStore';

interface StudioSceneProps {
  scrollProgress: number; // 0.0 to 1.0
  activeComponentId: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  highlightedComponents?: ComponentId[];
  currentStage: ExecutionStage | null;
  isExecuting: boolean;
}

// Pre-allocated static scratch vectors to eliminate per-frame GC allocations
const tempTargetPos = new THREE.Vector3();
const tempLookTarget = new THREE.Vector3();

// Camera controller that smoothly animates camera position & lookAt target based on scroll progress
const CinematicCameraController: React.FC<{ scrollProgress: number; activeComponentId: ComponentId | null }> = ({
  scrollProgress: propScroll,
  activeComponentId
}) => {
  const currentPos = useRef(new THREE.Vector3(4.5, 2.6, 5.2));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera }) => {
    // Read from continuous 60fps lerp store
    const scrollProgress = scrollStore.currentProgress !== undefined ? scrollStore.currentProgress : propScroll;

    // 1. Determine base camera position based on synchronized scene zone timeline
    if (scrollProgress < 0.12) {
      // 0–12% (HERO): Closed laptop, cinematic 3/4 angle
      tempTargetPos.set(4.5, 2.6, 5.2);
      tempLookTarget.set(0, 0, 0);
    } else if (scrollProgress < 0.28) {
      // 12–28%: Laptop rotates forward & lid opens
      const t = (scrollProgress - 0.12) / (0.28 - 0.12);
      tempTargetPos.set(
        THREE.MathUtils.lerp(4.5, 0.0, t),
        THREE.MathUtils.lerp(2.6, 2.0, t),
        THREE.MathUtils.lerp(5.2, 4.6, t)
      );
      tempLookTarget.set(0, THREE.MathUtils.lerp(0, 0.3, t), 0);
    } else if (scrollProgress < 0.45) {
      // 28–45%: Screen activation & camera pushes into motherboard / CPU socket reveal
      const t = (scrollProgress - 0.28) / (0.45 - 0.28);
      tempTargetPos.set(
        THREE.MathUtils.lerp(0.0, 0.0, t),
        THREE.MathUtils.lerp(2.0, 3.4, t),
        THREE.MathUtils.lerp(4.6, 2.2, t)
      );
      tempLookTarget.set(0, THREE.MathUtils.lerp(0.3, 0.2, t), THREE.MathUtils.lerp(0, 0.4, t));
    } else if (scrollProgress < 0.65) {
      // 45–65% (ARCHITECTURE): CPU exploded architecture, elevated 3/4 technical inspection angle
      const t = (scrollProgress - 0.45) / (0.65 - 0.45);
      tempTargetPos.set(
        THREE.MathUtils.lerp(0.0, 2.6, t),
        THREE.MathUtils.lerp(3.4, 3.8, t),
        THREE.MathUtils.lerp(2.2, 4.4, t)
      );
      tempLookTarget.set(0, THREE.MathUtils.lerp(0.2, 1.1, t), THREE.MathUtils.lerp(0.4, 0.1, t));
    } else if (scrollProgress < 0.80) {
      // 65–80% (EXECUTION): Instruction execution (ADD x3, x1, x2), camera focuses on datapath / ALU / Registers
      const t = (scrollProgress - 0.65) / (0.80 - 0.65);
      tempTargetPos.set(
        THREE.MathUtils.lerp(2.6, -1.2, t),
        THREE.MathUtils.lerp(3.8, 2.8, t),
        THREE.MathUtils.lerp(4.4, 3.4, t)
      );
      tempLookTarget.set(
        THREE.MathUtils.lerp(0, -0.7, t),
        THREE.MathUtils.lerp(1.1, 0.9, t),
        THREE.MathUtils.lerp(0.1, 1.1, t)
      );
    } else if (scrollProgress < 0.89) {
      // 80–89% (CACHE): Cache hierarchy view
      const t = (scrollProgress - 0.80) / (0.89 - 0.80);
      tempTargetPos.set(
        THREE.MathUtils.lerp(-1.2, 1.0, t),
        THREE.MathUtils.lerp(2.8, 3.6, t),
        THREE.MathUtils.lerp(3.4, 3.8, t)
      );
      tempLookTarget.set(
        THREE.MathUtils.lerp(-0.7, 0.0, t),
        THREE.MathUtils.lerp(0.9, 1.8, t),
        THREE.MathUtils.lerp(1.1, -0.6, t)
      );
    } else if (scrollProgress < 0.95) {
      // 89–95% (PIPELINE): Pipeline section view
      const t = (scrollProgress - 0.89) / (0.95 - 0.89);
      tempTargetPos.set(
        THREE.MathUtils.lerp(1.0, 0.0, t),
        THREE.MathUtils.lerp(3.6, 4.4, t),
        THREE.MathUtils.lerp(3.8, 3.8, t)
      );
      tempLookTarget.set(0, THREE.MathUtils.lerp(1.8, 2.2, t), THREE.MathUtils.lerp(-0.6, -1.4, t));
    } else {
      // 95–100% (FINAL): Final overview pull-back
      tempTargetPos.set(2.4, 3.6, 4.8);
      tempLookTarget.set(0, 1.0, 0);
    }

    // If a specific component is clicked, add subtle camera focus offset
    if (activeComponentId && scrollProgress >= 0.50) {
      tempTargetPos.y += 0.2;
    }

    // Smooth camera damping for buttery 60fps cinematic movement
    currentPos.current.lerp(tempTargetPos, 0.08);
    currentTarget.current.lerp(tempLookTarget, 0.08);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);
  });

  return null;
};

export const StudioScene: React.FC<StudioSceneProps> = ({
  scrollProgress,
  activeComponentId,
  onSelectComponent,
  highlightedComponents = [],
  currentStage,
  isExecuting
}) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}>
      <Canvas
        shadows
        camera={{ position: [4.5, 2.6, 5.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <CinematicCameraController
          scrollProgress={scrollProgress}
          activeComponentId={activeComponentId}
        />

        {/* =================================================== */}
        {/* STUDIO LIGHTING RIG                                */}
        {/* =================================================== */}
        {/* Ambient Fill */}
        <ambientLight intensity={0.45} color="#e6edf3" />

        {/* Studio Key Light */}
        <directionalLight
          position={[6, 8, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-near={1}
          shadow-camera-far={25}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-bias={-0.0001}
          color="#ffffff"
        />

        {/* Rim Light */}
        <directionalLight
          position={[-6, 4, -5]}
          intensity={0.9}
          color="#94a3b8"
        />

        {/* Subtle Signature Orange Studio Accent Light */}
        <pointLight
          position={[0, 3.5, 1]}
          intensity={0.65}
          color="#ff6a00"
          distance={10}
        />

        {/* =================================================== */}
        {/* 3D SCENE OBJECTS                                   */}
        {/* =================================================== */}
        <LaptopModel
          scrollProgress={scrollProgress}
          activeComponentId={activeComponentId}
        />

        <CPUArchitecture
          scrollProgress={scrollProgress}
          activeComponentId={activeComponentId}
          onSelectComponent={onSelectComponent}
          highlightedComponents={highlightedComponents}
        />

        {/* 3D Datapath Particle Bus */}
        <DataFlowParticles
          currentStage={currentStage}
          scrollProgress={scrollProgress}
          isExecuting={isExecuting}
        />

        {/* Contact Shadow on Studio Ground */}
        <ContactShadows
          position={[0, -0.18, 0]}
          opacity={0.65}
          scale={10}
          blur={1.8}
          far={4}
          color="#000000"
        />

        {/* Studio Floor Grid Plane */}
        <mesh position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial
            color="#090a0c"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      </Canvas>
    </div>
  );
};

