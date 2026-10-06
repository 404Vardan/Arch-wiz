import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { EngineState } from '../../engine/CPUExecutionEngine';
import { ComponentId } from '../../types';
import { SimulatorDatapath } from './SimulatorDatapath';

interface SimulatorSceneProps {
  engineState: EngineState;
  isPlaying: boolean;
  onInspectComponent?: (id: ComponentId) => void;
}

export const SimulatorScene: React.FC<SimulatorSceneProps> = ({
  engineState,
  isPlaying,
  onInspectComponent
}) => {
  const [cameraZ, setCameraZ] = useState<number>(12.2);

  // Responsive camera framing across 1920x1080, 1600x900, 1366x768, 1280x720, and ultra-wide/laptop screens
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspect = width / Math.max(1, height);

      // Base optimal distance for 16:9 viewports
      let z = 12.0;

      // If aspect ratio is narrower than 16:9 (e.g. 16:10 or 4:3), zoom back slightly to prevent side clipping
      if (aspect < 1.7) {
        z = 12.0 * (1.7 / Math.max(aspect, 1.25));
      }

      // If screen height is tight (< 780px), ensure vertical clearance
      if (height < 780) {
        z = Math.max(z, 12.6);
      }

      setCameraZ(z);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0.2, -0.15, cameraZ], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: '#090b0f' }}
      >
        {/* Technical Studio Lighting */}
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 8, 8]} intensity={1.5} />
        <directionalLight position={[-6, -4, 4]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#ff6a00" />

        {/* Studio Background Grid Line Details */}
        <mesh position={[0, 0, -0.6]}>
          <planeGeometry args={[34, 22]} />
          <meshBasicMaterial color="#0b0e14" />
        </mesh>

        {/* Dedicated 3D Datapath Layout */}
        <SimulatorDatapath
          engineState={engineState}
          isPlaying={isPlaying}
          onInspectComponent={onInspectComponent}
        />
      </Canvas>
    </div>
  );
};
