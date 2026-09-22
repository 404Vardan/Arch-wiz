import { CPUComponentData, StageInfo, PipelineCycle } from '../types';

export const CPU_COMPONENTS: Record<string, CPUComponentData> = {
  PC: {
    id: 'PC',
    name: 'PC',
    fullName: 'PROGRAM COUNTER',
    category: 'Sequencing & Control',
    description: 'Stores the address of the next instruction to be fetched from memory.',
    position: [1.3, 0.12, 0.6],
    explodedPosition: [1.8, 1.1, 0.8],
    size: [0.9, 0.22, 0.8],
    color: '#22252a',
    role: 'Instruction Address Pointer',
    techSpecs: [
      { label: 'Register Width', value: '32-bit' },
      { label: 'Addressing', value: 'Byte-addressable' },
      { label: 'Auto-Increment', value: '+4 per cycle' }
    ],
    connections: ['MEMORY', 'CU']
  },
  IR: {
    id: 'IR',
    name: 'IR',
    fullName: 'INSTRUCTION REGISTER',
    category: 'Instruction Subsystem',
    description: 'Holds the current instruction opcode and operand specifiers being decoded and executed.',
    position: [0.2, 0.12, 0.6],
    explodedPosition: [0.3, 1.2, 0.9],
    size: [1.0, 0.22, 0.8],
    color: '#252930',
    role: 'Opcode & Operand Latch',
    techSpecs: [
      { label: 'Bit Field', value: 'Opcode[6] Rd[5] Rs[5] Rt[5]' },
      { label: 'Input Source', value: 'Memory / Cache Data Bus' },
      { label: 'Direct Feed', value: 'Control Unit Decoder' }
    ],
    connections: ['CU', 'REG_FILE']
  },
  CU: {
    id: 'CU',
    name: 'CONTROL UNIT',
    fullName: 'CONTROL UNIT',
    category: 'Control Logic',
    description: 'Coordinates the sequence of operations required to execute an instruction by issuing micro-control signals.',
    position: [0.7, 0.12, 1.5],
    explodedPosition: [1.0, 1.8, 1.6],
    size: [1.6, 0.28, 1.0],
    color: '#1a1d22',
    role: 'Micro-operation Orchestrator',
    techSpecs: [
      { label: 'Control Style', value: 'Hardwired / Microprogrammed' },
      { label: 'Signal Lines', value: 'ALUOp, RegWrite, MemRead' },
      { label: 'Cycle Timing', value: 'Synchronous State Machine' }
    ],
    connections: ['ALU', 'REG_FILE', 'MEMORY', 'IR']
  },
  REG_FILE: {
    id: 'REG_FILE',
    name: 'REGISTER FILE',
    fullName: 'REGISTER FILE',
    category: 'Storage & Datapath',
    description: 'Stores temporary operands and processor registers (R0–R7) used during instruction execution.',
    position: [-0.9, 0.12, 0.6],
    explodedPosition: [-1.4, 0.9, 0.7],
    size: [1.2, 0.25, 1.1],
    color: '#282d34',
    role: 'Dual-Read Single-Write Storage',
    techSpecs: [
      { label: 'Ports', value: '2 Read Ports, 1 Write Port' },
      { label: 'Capacity', value: '32 General Purpose Registers' },
      { label: 'Access Latency', value: '< 0.3 ns' }
    ],
    connections: ['ALU', 'IR']
  },
  ALU: {
    id: 'ALU',
    name: 'ALU',
    fullName: 'ARITHMETIC LOGIC UNIT',
    category: 'Core Execution',
    description: 'Performs high-speed arithmetic (ADD, SUB) and logical (AND, OR, XOR) operations on processor data.',
    position: [-0.9, 0.12, 1.8],
    explodedPosition: [-1.3, 0.4, 1.9],
    size: [1.3, 0.32, 1.2],
    color: '#1e2127',
    role: 'High-Speed Math & Logic Engine',
    techSpecs: [
      { label: 'Operations', value: 'ADD, SUB, AND, OR, SLT' },
      { label: 'Flags', value: 'Zero, Carry, Overflow, Negative' },
      { label: 'Operand Width', value: '32-bit Parallel' }
    ],
    connections: ['REG_FILE', 'CU']
  },
  MEMORY: {
    id: 'MEMORY',
    name: 'MEMORY',
    fullName: 'MAIN MEMORY BUS',
    category: 'Storage Hierarchy',
    description: 'Supplies instructions and data to the processor over high-bandwidth address and data lines.',
    position: [0.8, 0.1, -0.6],
    explodedPosition: [1.2, 2.3, -0.8],
    size: [1.8, 0.22, 1.1],
    color: '#1c1f24',
    role: 'Instruction & Data Storage',
    techSpecs: [
      { label: 'Architecture', value: 'Unified Von Neumann / Harvard' },
      { label: 'Address Space', value: '4GB (32-bit)' },
      { label: 'Hierarchy Rank', value: 'Primary System RAM' }
    ],
    connections: ['PC', 'CACHE', 'IR']
  },
  CACHE: {
    id: 'CACHE',
    name: 'CACHE',
    fullName: 'L1/L2 CACHE SUBSYSTEM',
    category: 'Memory Optimization',
    description: 'Ultra-low latency static RAM holding frequently referenced code and working data sets.',
    position: [-0.8, 0.1, -0.6],
    explodedPosition: [-1.2, 2.4, -0.7],
    size: [1.5, 0.22, 1.0],
    color: '#262a32',
    role: 'Latency Bridging Cache',
    techSpecs: [
      { label: 'Structure', value: 'Split L1 I-Cache & D-Cache' },
      { label: 'Placement', value: '4-Way Set Associative' },
      { label: 'Policy', value: 'Write-Through / Write-Back' }
    ],
    connections: ['MEMORY', 'PC', 'REG_FILE']
  },
  PIPELINE: {
    id: 'PIPELINE',
    name: 'PIPELINE',
    fullName: 'PIPELINE CONTROLLER',
    category: 'Throughput Architecture',
    description: 'Manages overlapped multi-instruction execution across Fetch, Decode, Execute, Memory, and Write-Back stages.',
    position: [0.0, 0.1, -1.6],
    explodedPosition: [0.0, 2.9, -1.8],
    size: [2.6, 0.26, 0.8],
    color: '#191c21',
    role: 'Instruction Throughput Multiplier',
    techSpecs: [
      { label: 'Depth', value: '5 Stages (IF-ID-EX-MEM-WB)' },
      { label: 'Hazard Unit', value: 'Data Forwarding & Stall Logic' },
      { label: 'Target CPI', value: 'Approaching 1.0 Cycle/Instr' }
    ],
    connections: ['PC', 'IR', 'CU', 'ALU', 'REG_FILE']
  }
};

export const EXECUTION_STAGES: StageInfo[] = [
  {
    id: 'FETCH',
    number: '01',
    title: 'INSTRUCTION FETCH',
    description: 'The Program Counter (PC) emits address 0x0040 onto the address bus. Main Memory retrieves the instruction word for ADD x3, x1, x2 into the Instruction Register (IR).',
    activeComponents: ['PC', 'MEMORY', 'IR'],
    dataFlowDescription: 'PC (0x0040) → Memory Address Bus → Instruction Packet Retrieved → Latched into IR',
    busPath: [['PC', 'MEMORY'], ['MEMORY', 'IR']],
    microOps: [
      'MAR ← [PC] (0x0040)',
      'Memory Read: M[0x0040] → MBR',
      'IR ← MBR (ADD x3, x1, x2 [0x002081B3])',
      'PC ← PC + 4 (0x0044)',
      'FETCH COMPLETE'
    ],
    cpuState: {
      pc: '0x0040',
      ir: 'ADD x3, x1, x2',
      r1: 20,
      r2: 22,
      r3: 0,
      aluOp: 'STANDBY',
      aluResult: null,
      status: 'FETCH COMPLETE: IR ← ADD x3, x1, x2'
    },
    controlSignals: {
      opcode: '0110011',
      funct3: '000',
      funct7: '0000000',
      rd: 'x3',
      rs1: 'x1',
      rs2: 'x2',
      aluOp: 'STANDBY',
      regWrite: '0'
    }
  },
  {
    id: 'DECODE',
    number: '02',
    title: 'INSTRUCTION DECODE & CONTROL GENERATION',
    description: 'The instruction moves from IR to the Control Unit. The CU decodes opcode 0110011, funct3 000, and funct7 0000000 to synthesize datapath control lines.',
    activeComponents: ['IR', 'CU'],
    dataFlowDescription: 'IR (ADD x3, x1, x2) → Control Unit Decoder → Asserts ALUOp=ADD, RegWrite=1, ALUSrc=0',
    busPath: [['IR', 'CU']],
    microOps: [
      'Decode Opcode: 0110011 (RV32I OP / R-Type)',
      'Decode funct3: 000 (ADD) & funct7: 0000000',
      'Extract Source Registers: rs1 = x1, rs2 = x2',
      'Extract Destination Register: rd = x3',
      'Generate Control Signals: ALUOp=ADD, RegWrite=1, MemToReg=0'
    ],
    cpuState: {
      pc: '0x0044',
      ir: 'ADD x3, x1, x2',
      r1: 20,
      r2: 22,
      r3: 0,
      aluOp: 'ADD_PREPARE',
      aluResult: null,
      status: 'DECODING COMPLETE: ALUOp=ADD, RegWrite=1'
    },
    controlSignals: {
      opcode: '0110011',
      funct3: '000',
      funct7: '0000000',
      rd: 'x3',
      rs1: 'x1',
      rs2: 'x2',
      aluOp: 'ADD',
      regWrite: '1'
    }
  },
  {
    id: 'REGISTER_READ',
    number: '03',
    title: 'REGISTER OPERAND READ',
    description: 'The Register File addresses rs1 (x1) and rs2 (x2). Two operand data packets physically leave the dual read ports: x1=20 and x2=22 travel to the ALU inputs.',
    activeComponents: ['REG_FILE', 'ALU'],
    dataFlowDescription: 'Register File Read Port 1 (x1=20) & Port 2 (x2=22) → ALU Operand Input Buses',
    busPath: [['REG_FILE', 'ALU']],
    microOps: [
      'Read Address 1 ← x1 (contains 20)',
      'Read Address 2 ← x2 (contains 22)',
      'Operand A Latch ← 20 (x1)',
      'Operand B Latch ← 22 (x2)',
      'ALU Inputs Primed for Addition'
    ],
    cpuState: {
      pc: '0x0044',
      ir: 'ADD x3, x1, x2',
      r1: 20,
      r2: 22,
      r3: 0,
      aluOp: 'OPERANDS_LATCHED',
      aluResult: null,
      status: 'OPERANDS READ: x1 = 20, x2 = 22'
    },
    controlSignals: {
      opcode: '0110011',
      funct3: '000',
      funct7: '0000000',
      rd: 'x3',
      rs1: 'x1',
      rs2: 'x2',
      aluOp: 'ADD',
      regWrite: '1'
    }
  },
  {
    id: 'EXECUTE',
    number: '04',
    title: 'ALU EXECUTION',
    description: 'The Arithmetic Logic Unit executes 20 + 22 through its 32-bit parallel adder core, producing result 42. A result packet travels along the write-back bus.',
    activeComponents: ['ALU', 'REG_FILE'],
    dataFlowDescription: 'ALU executes 20 + 22 → Sum Output = 42 → Flags: Zero=0, Carry=0, Overflow=0',
    busPath: [['ALU', 'REG_FILE']],
    microOps: [
      'ALU Operation: 20 + 22',
      '32-bit Adder Output: 42 (0x0000002A)',
      'Condition Flags: Z=0, C=0, V=0, N=0',
      'Result Packet dispatched onto Write-Back Bus'
    ],
    cpuState: {
      pc: '0x0044',
      ir: 'ADD x3, x1, x2',
      r1: 20,
      r2: 22,
      r3: 0,
      aluOp: '20 + 22 = 42',
      aluResult: 42,
      status: 'ALU COMPUTED: 20 + 22 = 42'
    },
    controlSignals: {
      opcode: '0110011',
      funct3: '000',
      funct7: '0000000',
      rd: 'x3',
      rs1: 'x1',
      rs2: 'x2',
      aluOp: 'ADD',
      regWrite: '1'
    }
  },
  {
    id: 'WRITE_BACK',
    number: '05',
    title: 'REGISTER WRITE-BACK',
    description: 'The computed result (42) reaches the Register File write port. With RegWrite asserted, register x3 commits the value, transitioning from 0 to 42.',
    activeComponents: ['ALU', 'REG_FILE'],
    dataFlowDescription: 'Write-Back Bus (42) → Register File Write Port [x3] → x3 latched: 0 → 42',
    busPath: [['ALU', 'REG_FILE']],
    microOps: [
      'Write Address ← x3',
      'Write Data Bus ← 42',
      'Assert RegWrite = 1',
      'x3 updated: 0 → 42',
      'INSTRUCTION COMPLETE: x3 = 42'
    ],
    cpuState: {
      pc: '0x0044',
      ir: 'ADD x3, x1, x2',
      r1: 20,
      r2: 22,
      r3: 42,
      aluOp: 'COMMITTED',
      aluResult: 42,
      status: '✓ INSTRUCTION COMPLETE: x3 = 42'
    },
    controlSignals: {
      opcode: '0110011',
      funct3: '000',
      funct7: '0000000',
      rd: 'x3',
      rs1: 'x1',
      rs2: 'x2',
      aluOp: 'ADD',
      regWrite: '1'
    }
  }
];

export const PIPELINE_CYCLES: PipelineCycle[] = [
  {
    cycle: 1,
    i1: 'IF',
    i2: '-',
    i3: '-',
    activeStage: 'Instruction 1 Fetch',
    description: 'Cycle 01: Instruction 1 (ADD) enters IF stage. Address 0x0040 fetched.'
  },
  {
    cycle: 2,
    i1: 'ID',
    i2: 'IF',
    i3: '-',
    activeStage: 'Instruction 1 Decode / Instruction 2 Fetch',
    description: 'Cycle 02: I1 moves to ID. Next instruction I2 enters IF concurrently.'
  },
  {
    cycle: 3,
    i1: 'EX',
    i2: 'ID',
    i3: 'IF',
    activeStage: 'Instruction 1 Execute / I2 Decode / I3 Fetch',
    description: 'Cycle 03: I1 executes ALU (20 + 22 = 42). I2 decodes operands. I3 fetched.'
  },
  {
    cycle: 4,
    i1: 'MEM',
    i2: 'EX',
    i3: 'ID',
    activeStage: 'Pipeline Full Utilization',
    description: 'Cycle 04: I1 memory stage (bypass). I2 executes in ALU. I3 decodes.'
  },
  {
    cycle: 5,
    i1: 'WB',
    i2: 'MEM',
    i3: 'EX',
    activeStage: 'First Instruction Completion',
    description: 'Cycle 05: I1 completes write-back (R3 ← 42). 3 instructions in flight.'
  }
];
