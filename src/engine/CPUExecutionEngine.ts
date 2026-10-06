// Pure TypeScript CPU Execution Engine
// Zero UI / Zero Three.js dependencies — Shared across ARCH-VIZ

export type StageId = 'FETCH' | 'DECODE' | 'REGISTER_READ' | 'EXECUTE' | 'WRITE_BACK';

export type ComponentLifecycleState = 'IDLE' | 'RECEIVING' | 'PROCESSING' | 'SENDING' | 'COMPLETE';

export interface RV32IControlSignals {
  opcode: string;
  funct3: string;
  funct7: string;
  rd: string;
  rs1: string;
  rs2: string;
  aluOp: string;
  regWrite: boolean;
  aluSrc: boolean; // 0 = reg, 1 = imm
  memRead: boolean;
  memWrite: boolean;
  memToReg: boolean;
  branch: boolean;
}

export interface EngineInstruction {
  assembly: string;
  rawBytes: string; // 32-bit hex
  opcodeHex: string;
  rs1Name: string;
  rs2Name: string;
  rdName: string;
  imm?: number;
}

export interface EngineState {
  pc: number;
  ir: string;
  registers: Record<string, number>;
  memory: Record<number, number>;
  currentStage: StageId;
  stageIndex: number;
  controlSignals: RV32IControlSignals;
  activeMicroOps: string[];
  aluInputA: number;
  aluInputB: number;
  aluResult: number;
  flags: {
    zero: boolean;
    negative: boolean;
    carry: boolean;
    overflow: boolean;
  };
  componentStates: {
    pc: ComponentLifecycleState;
    memory: ComponentLifecycleState;
    ir: ComponentLifecycleState;
    cu: ComponentLifecycleState;
    regFile: ComponentLifecycleState;
    alu: ComponentLifecycleState;
  };
  isComplete: boolean;
}

export class CPUExecutionEngine {
  private state: EngineState;
  private listeners: Set<(state: EngineState) => void> = new Set();
  private instruction: EngineInstruction;

  constructor() {
    this.instruction = {
      assembly: 'ADD x3, x1, x2',
      rawBytes: '0x002081B3',
      opcodeHex: '0x33',
      rs1Name: 'x1',
      rs2Name: 'x2',
      rdName: 'x3'
    };

    this.state = this.getInitialState();
  }

  public getInitialState(): EngineState {
    const regs: Record<string, number> = {
      x0: 0,
      x1: 20,
      x2: 22,
      x3: 0,
      x4: 0,
      x5: 0,
      x6: 0,
      x7: 0
    };

    const mem: Record<number, number> = {
      0x0040: 0x002081b3, // ADD x3, x1, x2
      0x0044: 0x00000013  // NOP
    };

    return {
      pc: 0x0040,
      ir: 'ADD x3, x1, x2',
      registers: regs,
      memory: mem,
      currentStage: 'FETCH',
      stageIndex: 0,
      controlSignals: {
        opcode: '0110011',
        funct3: '000',
        funct7: '0000000',
        rd: 'x3',
        rs1: 'x1',
        rs2: 'x2',
        aluOp: 'STANDBY',
        regWrite: false,
        aluSrc: false,
        memRead: false,
        memWrite: false,
        memToReg: false,
        branch: false
      },
      activeMicroOps: [
        'MAR ← [PC] (0x0040)',
        'Memory Read: M[0x0040] → MBR',
        'IR ← MBR (0x002081B3)',
        'PC ← PC + 4 (0x0044)',
        'FETCH COMPLETE'
      ],
      aluInputA: 0,
      aluInputB: 0,
      aluResult: 0,
      flags: { zero: false, negative: false, carry: false, overflow: false },
      componentStates: {
        pc: 'SENDING',
        memory: 'RECEIVING',
        ir: 'IDLE',
        cu: 'IDLE',
        regFile: 'IDLE',
        alu: 'IDLE'
      },
      isComplete: false
    };
  }

  public getState(): EngineState {
    return { ...this.state };
  }

  public reset(instruction?: Partial<EngineInstruction>) {
    if (instruction) {
      this.instruction = { ...this.instruction, ...instruction };
    }
    this.state = this.getInitialState();
    this.notify();
  }

  public setStage(stageIndex: number) {
    const clamped = Math.max(0, Math.min(4, stageIndex));
    this.state.stageIndex = clamped;

    switch (clamped) {
      case 0: // FETCH
        this.state.currentStage = 'FETCH';
        this.state.pc = 0x0040;
        this.state.ir = this.instruction.assembly;
        this.state.registers.x3 = 0;
        this.state.aluInputA = 0;
        this.state.aluInputB = 0;
        this.state.aluResult = 0;
        this.state.flags = { zero: false, negative: false, carry: false, overflow: false };
        this.state.activeMicroOps = [
          'PC (0x0040) asserts address on Address Bus',
          'Memory Read: M[0x0040] retrieved (0x002081B3)',
          'Instruction Bus transfers word to IR',
          'IR latches instruction: ADD x3, x1, x2',
          'FETCH COMPLETE // ALU in Standby'
        ];
        this.state.componentStates = {
          pc: 'SENDING',
          memory: 'PROCESSING',
          ir: 'RECEIVING',
          cu: 'IDLE',
          regFile: 'IDLE',
          alu: 'IDLE'
        };
        this.state.controlSignals = {
          opcode: '0110011',
          funct3: '000',
          funct7: '0000000',
          rd: 'x3',
          rs1: 'x1',
          rs2: 'x2',
          aluOp: 'STANDBY',
          regWrite: false,
          aluSrc: false,
          memRead: true,
          memWrite: false,
          memToReg: false,
          branch: false
        };
        this.state.isComplete = false;
        break;

      case 1: // DECODE
        this.state.currentStage = 'DECODE';
        this.state.pc = 0x0044;
        this.state.registers.x3 = 0;
        this.state.aluInputA = 0;
        this.state.aluInputB = 0;
        this.state.aluResult = 0;
        this.state.flags = { zero: false, negative: false, carry: false, overflow: false };
        this.state.controlSignals = {
          opcode: '0110011',
          funct3: '000',
          funct7: '0000000',
          rd: this.instruction.rdName,
          rs1: this.instruction.rs1Name,
          rs2: this.instruction.rs2Name,
          aluOp: 'ADD',
          regWrite: true,
          aluSrc: false,
          memRead: false,
          memWrite: false,
          memToReg: false,
          branch: false
        };
        this.state.activeMicroOps = [
          'IR dispatches opcode 0110011 (RV32I OP / R-Type) to Control Unit',
          'Control Unit decodes funct3: 000 & funct7: 0000000 → ADD operation',
          `Extract Source Registers: rs1 = ${this.instruction.rs1Name}, rs2 = ${this.instruction.rs2Name}`,
          `Extract Destination Register: rd = ${this.instruction.rdName}`,
          'Assert Control Lines: ALUOp = ADD, RegWrite = 1 (pending writeback)'
        ];
        this.state.componentStates = {
          pc: 'COMPLETE',
          memory: 'IDLE',
          ir: 'SENDING',
          cu: 'PROCESSING',
          regFile: 'RECEIVING',
          alu: 'IDLE'
        };
        this.state.isComplete = false;
        break;

      case 2: // REGISTER_READ
        this.state.currentStage = 'REGISTER_READ';
        this.state.registers.x3 = 0; // x3 is STRICTLY 0 before ALU execution and writeback!
        this.state.aluInputA = this.state.registers[this.instruction.rs1Name] ?? 20;
        this.state.aluInputB = this.state.registers[this.instruction.rs2Name] ?? 22;
        this.state.aluResult = 0; // Result does not exist until ALU executes
        this.state.flags = { zero: false, negative: false, carry: false, overflow: false };
        this.state.activeMicroOps = [
          `Register File Read Port 1 reads ${this.instruction.rs1Name} = ${this.state.aluInputA}`,
          `Register File Read Port 2 reads ${this.instruction.rs2Name} = ${this.state.aluInputB}`,
          `Operand A (20) & Operand B (22) travel along operand buses to ALU`,
          'ALU input latches primed // Destination x3 remains at 0',
          'REGISTER READ COMPLETE'
        ];
        this.state.componentStates = {
          pc: 'IDLE',
          memory: 'IDLE',
          ir: 'IDLE',
          cu: 'COMPLETE',
          regFile: 'SENDING',
          alu: 'RECEIVING'
        };
        this.state.isComplete = false;
        break;

      case 3: // EXECUTE
        this.state.currentStage = 'EXECUTE';
        this.state.registers.x3 = 0; // x3 is STILL 0 until Write Back!
        this.state.aluInputA = 20;
        this.state.aluInputB = 22;
        this.state.aluResult = this.state.aluInputA + this.state.aluInputB; // 42
        this.state.flags = {
          zero: this.state.aluResult === 0,
          negative: this.state.aluResult < 0,
          carry: false,
          overflow: false
        };
        this.state.activeMicroOps = [
          `ALU Core Operation: ${this.state.aluInputA} + ${this.state.aluInputB}`,
          `32-bit Parallel Adder Output: ${this.state.aluResult} (0x0000002A)`,
          'Derived ALU Status: Z=0, N=0, C=0, V=0 (Non-architectural educational flags)',
          'Dispatched Result Packet 42 onto Write-Back Bus',
          'EXECUTE COMPLETE // Register x3 still holds 0'
        ];
        this.state.componentStates = {
          pc: 'IDLE',
          memory: 'IDLE',
          ir: 'IDLE',
          cu: 'IDLE',
          regFile: 'IDLE',
          alu: 'PROCESSING'
        };
        this.state.isComplete = false;
        break;

      case 4: // WRITE_BACK
        this.state.currentStage = 'WRITE_BACK';
        this.state.aluInputA = 20;
        this.state.aluInputB = 22;
        this.state.aluResult = 42;
        this.state.registers[this.instruction.rdName] = 42; // x3 becomes 42 only during WRITE BACK!
        this.state.activeMicroOps = [
          `Write-Back Bus delivers result 42 to Register File Write Port`,
          'RegWrite asserted (1) for destination register rd = x3',
          `${this.instruction.rdName} latched: 0 ──► ${this.state.registers[this.instruction.rdName]}`,
          `✓ INSTRUCTION COMPLETE: ${this.instruction.rdName} = ${this.state.registers[this.instruction.rdName]}`,
          'All micro-operations committed successfully'
        ];
        this.state.componentStates = {
          pc: 'IDLE',
          memory: 'IDLE',
          ir: 'IDLE',
          cu: 'IDLE',
          regFile: 'COMPLETE',
          alu: 'COMPLETE'
        };
        this.state.isComplete = true;
        break;
    }

    this.notify();
  }

  public step() {
    const next = (this.state.stageIndex + 1) % 5;
    this.setStage(next);
  }

  public subscribe(listener: (state: EngineState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const cpuEngine = new CPUExecutionEngine();
