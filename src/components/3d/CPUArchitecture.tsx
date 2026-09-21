import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ComponentId } from '../../types';

interface CPUArchitectureProps {
  scrollProgress: number; // 0.0 to 1.0
  activeComponentId: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  highlightedComponents?: ComponentId[];
}

export const CPUArchitecture: React.FC<CPUArchitectureProps> = ({
  scrollProgress,
  activeComponentId,
  onSelectComponent,
  highlightedComponents = []
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = useState<ComponentId | null>(null);

  // Calculate explosion factor:
  // 0.0 before 0.45, smoothly ramps to 1.0 from 0.45 to 0.68
  const explosionFactor = Math.max(0, Math.min(1, (scrollProgress - 0.45) / (0.68 - 0.45)));
  // Smooth cubic easing for explosion
  const easedExplosion = explosionFactor * explosionFactor * (3 - 2 * explosionFactor);

  // Visibility of architecture: emerges as laptop lid opens and camera enters
  const isArchitectureVisible = scrollProgress >= 0.35;
  const showLabels = scrollProgress >= 0.52;

  useFrame(() => {
    if (!groupRef.current) return;
    // Architecture subtle floating drift when exploded
    if (easedExplosion > 0.3) {
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.04;
    } else {
      groupRef.current.position.y = 0;
    }
  });

  if (!isArchitectureVisible) return null;

  return (
    <group ref={groupRef} position={[0, 0.05, 0]}>
      {/* =================================================== */}
      {/* 1. MOTHERBOARD PCB & SILICON SUBSTRATE             */}
      {/* =================================================== */}
      <group position={[0, -0.01, 0]}>
        {/* Main Motherboard Substrate (Dark Charcoal / Deep Green Tech Matte) */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[4.4, 0.04, 2.9]} />
          <meshStandardMaterial
            color="#0b1013"
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* CPU Socket Bezel & Outer Retainer Frame */}
        <mesh position={[0, 0.025, 0.4]}>
          <boxGeometry args={[3.8, 0.03, 2.2]} />
          <meshStandardMaterial
            color="#14171a"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        {/* Gold Bond Pin Array Grid (CPU Socket Pins) */}
        <mesh position={[0, 0.04, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.5, 1.9]} />
          <meshStandardMaterial
            color="#c99738"
            metalness={0.9}
            roughness={0.2}
            wireframe
          />
        </mesh>

        {/* Printed Circuit Traces (Procedural Glowing Technical Bus Lines) */}
        <group position={[0, 0.026, 0.4]}>
          {[-1.6, -1.1, -0.6, 0.6, 1.1, 1.6].map((x, i) => (
            <mesh key={`trace-${i}`} position={[x, 0, 0]}>
              <boxGeometry args={[0.04, 0.005, 1.8]} />
              <meshBasicMaterial color="#ff6a00" opacity={0.35} transparent />
            </mesh>
          ))}
          {[-0.8, -0.3, 0.2, 0.7].map((z, i) => (
            <mesh key={`cross-trace-${i}`} position={[0, 0, z]}>
              <boxGeometry args={[3.2, 0.005, 0.03]} />
              <meshBasicMaterial color="#ff6a00" opacity={0.25} transparent />
            </mesh>
          ))}
        </group>
      </group>

      {/* =================================================== */}
      {/* 2. EXPLODED CPU COMPONENTS (3D Physical Blocks)    */}
      {/* =================================================== */}
      {Object.values(CPU_COMPONENTS).map((comp) => {
        const isSelected = activeComponentId === comp.id;
        const isHovered = hoveredId === comp.id;
        const isHighlighted = highlightedComponents.includes(comp.id) || isSelected;

        // Interpolate between flat position on socket and exploded 3D position
        const currentX = comp.position[0] + (comp.explodedPosition[0] - comp.position[0]) * easedExplosion;
        const currentY = comp.position[1] + (comp.explodedPosition[1] - comp.position[1]) * easedExplosion;
        const currentZ = comp.position[2] + (comp.explodedPosition[2] - comp.position[2]) * easedExplosion;

        const scaleMultiplier = isSelected ? 1.08 : isHovered ? 1.04 : 1.0;

        return (
          <group key={comp.id} position={[currentX, currentY, currentZ]}>
            {/* Component Main Silicon / Metallic Die */}
            <mesh
              castShadow
              receiveShadow
              scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(comp.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredId(null);
                document.body.style.cursor = 'default';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComponent(comp.id);
              }}
            >
              <boxGeometry args={comp.size} />
              <meshStandardMaterial
                color={
                  isSelected
                    ? '#ff6a00'
                    : isHighlighted
                    ? '#ff7a1a'
                    : isHovered
                    ? '#2d333d'
                    : comp.color
                }
                metalness={isSelected || isHighlighted ? 0.4 : 0.85}
                roughness={isSelected || isHighlighted ? 0.2 : 0.3}
                emissive={
                  isSelected
                    ? '#ff6a00'
                    : isHighlighted
                    ? '#ff5500'
                    : '#000000'
                }
                emissiveIntensity={isSelected ? 0.7 : isHighlighted ? 0.45 : 0}
              />
            </mesh>

            {/* Heatspreader / Silicon Top Micro-Pattern */}
            <mesh position={[0, comp.size[1] / 2 + 0.005, 0]}>
              <boxGeometry args={[comp.size[0] * 0.9, 0.004, comp.size[2] * 0.9]} />
              <meshStandardMaterial
                color={isSelected ? '#141414' : '#111317'}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            {/* Micro gold contact pads along edge */}
            <mesh position={[0, -comp.size[1] / 2 - 0.005, 0]}>
              <boxGeometry args={[comp.size[0] * 0.96, 0.01, comp.size[2] * 0.96]} />
              <meshStandardMaterial
                color="#e5a93c"
                metalness={0.95}
                roughness={0.15}
              />
            </mesh>

            {/* 3D Vertical Technical Guide Pole / Bus Line when exploded */}
            {easedExplosion > 0.15 && (
              <mesh position={[0, -(currentY - comp.position[1]) / 2, 0]}>
                <cylinderGeometry
                  args={[
                    isSelected || isHighlighted ? 0.018 : 0.008,
                    isSelected || isHighlighted ? 0.018 : 0.008,
                    Math.max(0.01, currentY - comp.position[1]),
                    8
                  ]}
                />
                <meshBasicMaterial
                  color={isSelected || isHighlighted ? '#ff6a00' : '#47505d'}
                  transparent
                  opacity={isSelected || isHighlighted ? 0.9 : 0.4}
                />
              </mesh>
            )}

            {/* Floating Technical 3D HUD Label */}
            {showLabels && (
              <Html
                position={[0, comp.size[1] / 2 + 0.3, 0]}
                center
                distanceFactor={7}
                style={{ pointerEvents: 'auto' }}
              >
                <div
                  onClick={() => onSelectComponent(comp.id)}
                  style={{
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSelected
                        ? '#ff6a00'
                        : isHighlighted
                        ? 'rgba(255, 106, 0, 0.9)'
                        : 'rgba(14, 16, 20, 0.88)',
                      color: isSelected ? '#000000' : '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '3px',
                      border: `1px solid ${
                        isSelected
                          ? '#ff6a00'
                          : isHovered
                          ? '#ff6a00'
                          : 'rgba(255, 255, 255, 0.16)'
                      }`,
                      backdropFilter: 'blur(8px)',
                      boxShadow: isSelected
                        ? '0 4px 20px rgba(255, 106, 0, 0.5)'
                        : '0 4px 12px rgba(0,0,0,0.5)',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: '11px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: isSelected
                          ? '#000'
                          : isHighlighted
                          ? '#ffffff'
                          : '#ff6a00'
                      }}
                    />
                    {comp.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9px',
                      color: isSelected ? '#ff6a00' : 'rgba(255, 255, 255, 0.65)',
                      textShadow: '0 1px 4px #000'
                    }}
                  >
                    {comp.fullName}
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* =================================================== */}
      {/* 3. INTER-COMPONENT DATA BUS CONNECTIONS            */}
      {/* =================================================== */}
      {easedExplosion > 0.4 && (
        <group>
          {[
            ['PC', 'MEMORY'],
            ['MEMORY', 'IR'],
            ['IR', 'CU'],
            ['CU', 'REG_FILE'],
            ['REG_FILE', 'ALU'],
            ['CACHE', 'MEMORY'],
            ['PIPELINE', 'CU']
          ].map(([fromId, toId], idx) => {
            const from = CPU_COMPONENTS[fromId];
            const to = CPU_COMPONENTS[toId];
            if (!from || !to) return null;

            const fromPos = new THREE.Vector3(
              from.position[0] + (from.explodedPosition[0] - from.position[0]) * easedExplosion,
              from.position[1] + (from.explodedPosition[1] - from.position[1]) * easedExplosion,
              from.position[2] + (from.explodedPosition[2] - from.position[2]) * easedExplosion
            );
            const toPos = new THREE.Vector3(
              to.position[0] + (to.explodedPosition[0] - to.position[0]) * easedExplosion,
              to.position[1] + (to.explodedPosition[1] - to.position[1]) * easedExplosion,
              to.position[2] + (to.explodedPosition[2] - to.position[2]) * easedExplosion
            );

            const isBusActive =
              (activeComponentId === fromId && activeComponentId === toId) ||
              (highlightedComponents.includes(fromId as ComponentId) &&
                highlightedComponents.includes(toId as ComponentId));

            const points = [fromPos, toPos];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

            return (
              <primitive
                key={`bus-conn-${idx}`}
                object={
                  new THREE.Line(
                    lineGeo,
                    new THREE.LineBasicMaterial({
                      color: isBusActive ? '#ff6a00' : '#4a5360',
                      transparent: true,
                      opacity: isBusActive ? 0.95 : 0.35,
                      linewidth: isBusActive ? 2 : 1
                    })
                  )
                }
              />
            );
          })}
        </group>
      )}
    </group>
  );
};
