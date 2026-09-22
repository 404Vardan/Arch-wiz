import React from 'react';
import { Canvas } from '@react-three/fiber';
import { EngineState } from '../../engine/CPUExecutionEngine';
import { SimulatorDatapath } from './SimulatorDatapath';

interface SimulatorSceneProps {
  engineState: EngineState;
  isPlaying: boolean;
}

export const SimulatorScene: React.FC<SimulatorSceneProps> = ({
  engineState,
  isPlaying
}) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 10.5], fov: 46 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance'
        }}
        style={{ background: '#090b0f' }}
      >
        {/* Technical Studio Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 8, 8]} intensity={1.5} />
        <directionalLight position={[-6, -4, 4]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#ff6a00" />

        {/* Studio Background Grid Line Details */}
        <mesh position={[0, 0, -0.6]}>
          <planeGeometry args={[30, 20]} />
          <meshBasicMaterial color="#0b0e14" />
        </mesh>

        {/* Dedicated 3D Datapath Layout */}
        <SimulatorDatapath engineState={engineState} isPlaying={isPlaying} />
      </Canvas>
    </div>
  );
};
