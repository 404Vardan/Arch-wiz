import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EngineState } from '../../engine/CPUExecutionEngine';
import { ComponentId } from '../../types';
import { SimulatorPC } from './SimulatorPC';
import { SimulatorMemory } from './SimulatorMemory';
import { SimulatorIR } from './SimulatorIR';
import { SimulatorControlUnit } from './SimulatorControlUnit';
import { SimulatorRegisterFile } from './SimulatorRegisterFile';
import { SimulatorALU } from './SimulatorALU';
import { DataBus } from './DataBus';
import { InstructionPacket } from './InstructionPacket';

interface SimulatorDatapathProps {
  engineState: EngineState;
  isPlaying: boolean;
  onInspectComponent?: (id: ComponentId) => void;
}

export const SimulatorDatapath: React.FC<SimulatorDatapathProps> = ({
  engineState,
  isPlaying,
  onInspectComponent
}) => {
  // Continuous packet animation progress per stage (0.0 to 1.0)
  const animProgress = useRef(0);
  const lastStage = useRef(engineState.stageIndex);

  useFrame((_, delta) => {
    // Reset progress when stage changes
    if (lastStage.current !== engineState.stageIndex) {
      lastStage.current = engineState.stageIndex;
      animProgress.current = 0;
    }

    // Speed up animation if playing or looping
    const speed = isPlaying ? 1.4 : 0.9;
    animProgress.current = (animProgress.current + delta * speed) % 1.0;
  });

  const { stageIndex, componentStates, registers, controlSignals, flags } = engineState;

  // Calibrated 3D coordinates for datapath layout with generous breathing room and ZERO overlap:
  // TOP ROW: PC (-5.2, 2.7) -> Memory (0.0, 2.7) -> IR (5.2, 2.7)
  // SECOND ROW: Control Unit on the right (5.2, -0.2) directly below IR
  // LEFT/CENTER: Register File (-2.2, 0.25) - 7.4 units away from Control Unit horizontally!
  // BOTTOM CENTER: ALU (-2.2, -2.85) - cleanly spaced below Register File with full vertical breathing room
  const PC_POS: [number, number, number] = [-5.2, 2.7, 0];
  const MEM_POS: [number, number, number] = [0.0, 2.7, 0];
  const IR_POS: [number, number, number] = [5.2, 2.7, 0];
  const CU_POS: [number, number, number] = [5.2, -0.2, 0];
  const REG_POS: [number, number, number] = [-2.2, 0.25, 0];
  const ALU_POS: [number, number, number] = [-2.2, -2.85, 0];

  // Exact Bus Paths connecting physical ports directly in open space
  const busPcToMem: [number, number, number][] = [
    [-4.0, 2.7, 0],
    [-2.8, 2.7, 0],
    [-1.65, 2.7, 0]
  ];

  const busMemToIr: [number, number, number][] = [
    [1.65, 2.7, 0],
    [2.7, 2.7, 0],
    [3.75, 2.7, 0]
  ];

  const busIrToCu: [number, number, number][] = [
    [5.2, 1.95, 0],
    [5.2, 1.48, 0],
    [5.2, 1.0, 0]
  ];

  const busCuToReg: [number, number, number][] = [
    [3.55, 0.25, 0],
    [1.65, 0.25, 0],
    [-0.25, 0.25, 0]
  ];

  const busCuToAlu: [number, number, number][] = [
    [3.55, -0.8, 0],
    [1.2, -2.0, 0],
    [-1.1, -2.85, 0]
  ];

  const busRegAtoAluA: [number, number, number][] = [
    [-3.0, -0.95, 0],
    [-3.0, -1.4, 0],
    [-3.0, -1.9, 0]
  ];

  const busRegBtoAluB: [number, number, number][] = [
    [-1.4, -0.95, 0],
    [-1.4, -1.4, 0],
    [-1.4, -1.9, 0]
  ];

  const busAluToRegWrite: [number, number, number][] = [
    [-2.2, -3.8, 0],
    [-2.2, -4.25, 0],
    [-5.6, -4.25, 0],
    [-5.6, 0.55, 0],
    [-4.15, 0.55, 0]
  ];

  const t = animProgress.current;

  // Phased packet progress for sequential flow
  const tFetch1 = Math.min(1, Math.max(0, t * 1.7));
  const tFetch2 = Math.min(1, Math.max(0, (t - 0.35) * 1.54));

  const tDecode1 = Math.min(1, Math.max(0, t * 1.8));
  const tDecode2 = Math.min(1, Math.max(0, (t - 0.35) * 1.54));

  return (
    <group>
      {/* 1. Silicon Blocks with Educational Labels & Inspection Handlers */}
      <SimulatorPC
        position={PC_POS}
        pcValue={engineState.pc}
        lifecycleState={componentStates.pc}
        isActive={stageIndex === 0}
        onInspect={() => onInspectComponent?.('PC')}
      />

      <SimulatorMemory
        position={MEM_POS}
        lifecycleState={componentStates.memory}
        isActive={stageIndex === 0}
        instructionWord="ADD x3, x1, x2"
        onInspect={() => onInspectComponent?.('MEMORY')}
      />

      <SimulatorIR
        position={IR_POS}
        lifecycleState={componentStates.ir}
        isActive={stageIndex === 0 || stageIndex === 1}
        instructionString={engineState.ir}
        rawHex="0x002081B3"
        onInspect={() => onInspectComponent?.('IR')}
      />

      <SimulatorControlUnit
        position={CU_POS}
        lifecycleState={componentStates.cu}
        isActive={stageIndex === 1}
        controlSignals={controlSignals}
        onInspect={() => onInspectComponent?.('CU')}
      />

      <SimulatorRegisterFile
        position={REG_POS}
        lifecycleState={componentStates.regFile}
        isActive={stageIndex === 2 || stageIndex === 4}
        stageIndex={stageIndex}
        registers={registers}
        sourceRegs={{ rs1: 'x1', rs2: 'x2', rd: 'x3' }}
        isWriteBack={stageIndex === 4}
        onInspect={() => onInspectComponent?.('REG_FILE')}
      />

      <SimulatorALU
        position={ALU_POS}
        lifecycleState={componentStates.alu}
        isActive={stageIndex === 3}
        stageIndex={stageIndex}
        inputA={engineState.aluInputA}
        inputB={engineState.aluInputB}
        result={engineState.aluResult}
        flags={flags}
        onInspect={() => onInspectComponent?.('ALU')}
      />

      {/* 2. Physical 3D Datapath Buses */}
      {/* Address Bus: PC -> Memory */}
      <DataBus
        points={busPcToMem}
        color="#38bdf8"
        isActive={stageIndex === 0}
      />

      {/* Instruction Bus: Memory -> IR */}
      <DataBus
        points={busMemToIr}
        color="#c084fc"
        isActive={stageIndex === 0}
      />

      {/* Opcode Bus: IR -> CU */}
      <DataBus
        points={busIrToCu}
        color="#ff8533"
        isActive={stageIndex === 1}
      />

      {/* Control Signals: CU -> Register File */}
      <DataBus
        points={busCuToReg}
        color="#38bdf8"
        isActive={stageIndex === 1}
      />

      {/* ALU Control Signal: CU -> ALU */}
      <DataBus
        points={busCuToAlu}
        color="#ff8533"
        isActive={stageIndex === 1 || stageIndex === 3}
      />

      {/* Operand A Bus: Register File -> ALU */}
      <DataBus
        points={busRegAtoAluA}
        color="#ffd700"
        isActive={stageIndex === 2}
      />

      {/* Operand B Bus: Register File -> ALU */}
      <DataBus
        points={busRegBtoAluB}
        color="#38bdf8"
        isActive={stageIndex === 2}
      />

      {/* Write-Back Bus: ALU -> Register File */}
      <DataBus
        points={busAluToRegWrite}
        color="#4ade80"
        isActive={stageIndex === 3 || stageIndex === 4}
      />

      {/* 3. Physical Traveling Data Packets with Non-Overlapping Label Offsets */}

      {/* Stage 1 FETCH: Phase 1 PC -> Memory Address Packet */}
      <InstructionPacket
        points={busPcToMem}
        color="#38bdf8"
        label="ADDR: 0x0040"
        subLabel="ADDRESS BUS"
        progress={tFetch1}
        visible={stageIndex === 0}
        labelOffset={[0, 0.75, 0.35]}
      />

      {/* Stage 1 FETCH: Phase 2 Memory -> IR Instruction Packet */}
      <InstructionPacket
        points={busMemToIr}
        color="#c084fc"
        label="ADD x3, x1, x2"
        subLabel="0x002081B3"
        progress={tFetch2}
        visible={stageIndex === 0}
        labelOffset={[0, 0.75, 0.35]}
      />

      {/* Stage 2 DECODE: Phase 1 IR -> CU Opcode Packet */}
      <InstructionPacket
        points={busIrToCu}
        color="#ff8533"
        label="OPCODE: 0110011"
        subLabel="FUNCT3: 000 | FUNCT7: 00"
        progress={tDecode1}
        visible={stageIndex === 1}
        labelOffset={[1.4, 0, 0.35]}
      />

      {/* Stage 2 DECODE: Phase 2 CU -> RegFile Control Assertion Packet */}
      <InstructionPacket
        points={busCuToReg}
        color="#38bdf8"
        label="RegWrite = 1"
        subLabel="rs1=x1, rs2=x2, rd=x3"
        progress={tDecode2}
        visible={stageIndex === 1}
        labelOffset={[0, 0.65, 0.35]}
      />

      {/* Stage 2 DECODE & Stage 3 EXECUTE: CU -> ALU Control Packet */}
      <InstructionPacket
        points={busCuToAlu}
        color="#ff8533"
        label="ALUOp = ADD"
        subLabel="ALUSrc = 0 (Reg)"
        progress={t}
        visible={stageIndex === 1 || stageIndex === 3}
        labelOffset={[0.8, 0.4, 0.35]}
      />

      {/* Stage 3 REGISTER READ: Dual Operand Packets to ALU */}
      <InstructionPacket
        points={busRegAtoAluA}
        color="#ffd700"
        label="x1 = 20"
        subLabel="OPERAND A"
        progress={t}
        visible={stageIndex === 2}
        labelOffset={[-1.3, 0, 0.35]}
      />

      <InstructionPacket
        points={busRegBtoAluB}
        color="#38bdf8"
        label="x2 = 22"
        subLabel="OPERAND B"
        progress={t}
        visible={stageIndex === 2}
        labelOffset={[1.3, 0, 0.35]}
      />

      {/* Stage 4 EXECUTE / Stage 5 WRITE BACK: ALU -> Register File Result Packet */}
      <InstructionPacket
        points={busAluToRegWrite}
        color="#4ade80"
        label="RESULT: 42"
        subLabel="x3 ← 42"
        progress={t}
        visible={stageIndex === 3 || stageIndex === 4}
        labelOffset={[-0.8, 0.45, 0.35]}
      />
    </group>
  );
};
