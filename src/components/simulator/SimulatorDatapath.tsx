import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EngineState } from '../../engine/CPUExecutionEngine';
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
}

export const SimulatorDatapath: React.FC<SimulatorDatapathProps> = ({
  engineState,
  isPlaying
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

  // Exact 3D coordinates for datapath layout
  const PC_POS: [number, number, number] = [-4.8, 3.2, 0];
  const MEM_POS: [number, number, number] = [-0.2, 3.2, 0];
  const IR_POS: [number, number, number] = [4.2, 3.2, 0];
  const CU_POS: [number, number, number] = [4.2, 0.4, 0];
  const REG_POS: [number, number, number] = [-0.8, 0.4, 0];
  const ALU_POS: [number, number, number] = [-0.8, -2.6, 0];

  // Bus Paths (Coordinates)
  const busPcToMem: [number, number, number][] = [
    [-3.7, 3.2, 0],
    [-2.8, 3.2, 0],
    [-1.8, 3.2, 0]
  ];

  const busMemToIr: [number, number, number][] = [
    [1.4, 3.2, 0],
    [2.1, 3.2, 0],
    [2.8, 3.2, 0]
  ];

  const busIrToCu: [number, number, number][] = [
    [4.2, 2.5, 0],
    [4.2, 2.0, 0],
    [4.2, 1.5, 0]
  ];

  const busCuToReg: [number, number, number][] = [
    [2.6, 0.4, 0],
    [1.8, 0.4, 0],
    [1.1, 0.4, 0]
  ];

  const busRegAtoAluA: [number, number, number][] = [
    [-1.6, -0.8, 0],
    [-1.6, -1.3, 0],
    [-1.6, -1.7, 0]
  ];

  const busRegBtoAluB: [number, number, number][] = [
    [0.0, -0.8, 0],
    [0.0, -1.3, 0],
    [0.0, -1.7, 0]
  ];

  const busAluToRegWrite: [number, number, number][] = [
    [-0.8, -3.5, 0],
    [-3.4, -3.5, 0],
    [-3.4, 1.0, 0],
    [-2.7, 1.0, 0]
  ];

  const t = animProgress.current;

  return (
    <group>
      {/* 1. Silicon Blocks */}
      <SimulatorPC
        position={PC_POS}
        pcValue={engineState.pc}
        lifecycleState={componentStates.pc}
        isActive={stageIndex === 0}
      />

      <SimulatorMemory
        position={MEM_POS}
        lifecycleState={componentStates.memory}
        isActive={stageIndex === 0}
        instructionWord="ADD x3, x1, x2"
      />

      <SimulatorIR
        position={IR_POS}
        lifecycleState={componentStates.ir}
        isActive={stageIndex === 0 || stageIndex === 1}
        instructionString={engineState.ir}
        rawHex="0x002081B3"
      />

      <SimulatorControlUnit
        position={CU_POS}
        lifecycleState={componentStates.cu}
        isActive={stageIndex === 1}
        controlSignals={controlSignals}
      />

      <SimulatorRegisterFile
        position={REG_POS}
        lifecycleState={componentStates.regFile}
        isActive={stageIndex === 2 || stageIndex === 4}
        registers={registers}
        sourceRegs={{ rs1: 'x1', rs2: 'x2', rd: 'x3' }}
        isWriteBack={stageIndex === 4}
      />

      <SimulatorALU
        position={ALU_POS}
        lifecycleState={componentStates.alu}
        isActive={stageIndex === 3}
        inputA={engineState.aluInputA || 20}
        inputB={engineState.aluInputB || 22}
        result={engineState.aluResult || 42}
        flags={flags}
      />

      {/* 2. Physical 3D Datapath Buses */}
      <DataBus
        points={busPcToMem}
        color="#38bdf8"
        isActive={stageIndex === 0}
      />

      <DataBus
        points={busMemToIr}
        color="#c084fc"
        isActive={stageIndex === 0}
      />

      <DataBus
        points={busIrToCu}
        color="#ff8533"
        isActive={stageIndex === 1}
      />

      <DataBus
        points={busCuToReg}
        color="#38bdf8"
        isActive={stageIndex === 1}
      />

      <DataBus
        points={busRegAtoAluA}
        color="#ffd700"
        isActive={stageIndex === 2}
      />

      <DataBus
        points={busRegBtoAluB}
        color="#38bdf8"
        isActive={stageIndex === 2}
      />

      <DataBus
        points={busAluToRegWrite}
        color="#4ade80"
        isActive={stageIndex === 3 || stageIndex === 4}
      />

      {/* 3. Physical Traveling Data Packets */}

      {/* Stage 1 FETCH: PC -> Memory Address Packet */}
      <InstructionPacket
        points={busPcToMem}
        color="#38bdf8"
        label="ADDR: 0x0040"
        subLabel="ADDRESS BUS"
        progress={t}
        visible={stageIndex === 0}
      />

      {/* Stage 1 FETCH: Memory -> IR Instruction Packet */}
      <InstructionPacket
        points={busMemToIr}
        color="#c084fc"
        label="ADD x3, x1, x2"
        subLabel="INST WORD: 0x002081B3"
        progress={t}
        visible={stageIndex === 0}
      />

      {/* Stage 2 DECODE: IR -> CU Opcode Packet */}
      <InstructionPacket
        points={busIrToCu}
        color="#ff8533"
        label="OPCODE: 0110011"
        subLabel="FUNCT3: 000 | FUNCT7: 00"
        progress={t}
        visible={stageIndex === 1}
      />

      {/* Stage 2 DECODE: CU -> RegFile Control Assertion Packet */}
      <InstructionPacket
        points={busCuToReg}
        color="#38bdf8"
        label="RegWrite = 1"
        subLabel="ALUOp = ADD"
        progress={t}
        visible={stageIndex === 1}
      />

      {/* Stage 3 REGISTER READ: Dual Operand Packets to ALU */}
      <InstructionPacket
        points={busRegAtoAluA}
        color="#ffd700"
        label="x1 = 20"
        subLabel="OPERAND A"
        progress={t}
        visible={stageIndex === 2}
      />

      <InstructionPacket
        points={busRegBtoAluB}
        color="#38bdf8"
        label="x2 = 22"
        subLabel="OPERAND B"
        progress={t}
        visible={stageIndex === 2}
      />

      {/* Stage 4 EXECUTE / Stage 5 WRITE BACK: ALU -> Register File Result Packet */}
      <InstructionPacket
        points={busAluToRegWrite}
        color="#4ade80"
        label="RESULT: 42"
        subLabel="WRITE-BACK BUS"
        progress={t}
        visible={stageIndex === 3 || stageIndex === 4}
      />
    </group>
  );
};
