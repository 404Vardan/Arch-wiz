import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipForward, RotateCcw, Cpu, Terminal, Layers, ArrowRight, Code, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { audio } from '../../utils/audio';

interface InteractiveSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SimulatorTab = 'SINGLE_INST' | 'PROGRAM_RUNNER';

type InstructionType = 'ADD' | 'SUB' | 'AND' | 'OR' | 'SLT' | 'LOAD' | 'STORE' | 'BEQ';

interface InstructionDef {
  type: InstructionType;
  format: 'R' | 'I' | 'S' | 'B';
  opcode: string;
  funct3: string;
  funct7?: string;
  desc: string;
  defaultR1: number;
  defaultR2: number;
  defaultDest: string;
}

const INSTRUCTION_CATALOG: Record<InstructionType, InstructionDef> = {
  ADD: {
    type: 'ADD',
    format: 'R',
    opcode: '0110011',
    funct3: '000',
    funct7: '0000000',
    desc: 'Arithmetic addition: Rd = Rs1 + Rs2',
    defaultR1: 25,
    defaultR2: 17,
    defaultDest: 'R3'
  },
  SUB: {
    type: 'SUB',
    format: 'R',
    opcode: '0110011',
    funct3: '000',
    funct7: '0100000',
    desc: 'Arithmetic subtraction: Rd = Rs1 - Rs2',
    defaultR1: 64,
    defaultR2: 22,
    defaultDest: 'R3'
  },
  AND: {
    type: 'AND',
    format: 'R',
    opcode: '0110011',
    funct3: '111',
    funct7: '0000000',
    desc: 'Bitwise logical AND: Rd = Rs1 & Rs2',
    defaultR1: 15,
    defaultR2: 9,
    defaultDest: 'R3'
  },
  OR: {
    type: 'OR',
    format: 'R',
    opcode: '0110011',
    funct3: '110',
    funct7: '0000000',
    desc: 'Bitwise logical OR: Rd = Rs1 | Rs2',
    defaultR1: 12,
    defaultR2: 3,
    defaultDest: 'R3'
  },
  SLT: {
    type: 'SLT',
    format: 'R',
    opcode: '0110011',
    funct3: '010',
    funct7: '0000000',
    desc: 'Set Less Than: Rd = (Rs1 < Rs2) ? 1 : 0',
    defaultR1: 14,
    defaultR2: 40,
    defaultDest: 'R3'
  },
  LOAD: {
    type: 'LOAD',
    format: 'I',
    opcode: '0000011',
    funct3: '010',
    desc: 'Memory Read: Rd = Mem[Rs1 + Offset]',
    defaultR1: 4,
    defaultR2: 0,
    defaultDest: 'R3'
  },
  STORE: {
    type: 'STORE',
    format: 'S',
    opcode: '0100011',
    funct3: '010',
    desc: 'Memory Write: Mem[Rs1 + Offset] = Rs2',
    defaultR1: 4,
    defaultR2: 88,
    defaultDest: 'MEM[4]'
  },
  BEQ: {
    type: 'BEQ',
    format: 'B',
    opcode: '1100011',
    funct3: '000',
    desc: 'Branch if Equal: if (Rs1 == Rs2) PC += Offset',
    defaultR1: 10,
    defaultR2: 10,
    defaultDest: 'PC + 8'
  }
};

interface ProgramInstruction {
  pc: number;
  asm: string;
  comment: string;
  execute: (
    regs: number[],
    mem: Record<string, number>
  ) => { regs: number[]; mem: Record<string, number>; nextPc: number; modifiedReg?: number };
}

interface AssemblyProgram {
  id: string;
  name: string;
  description: string;
  initialRegs: number[];
  initialMem: Record<string, number>;
  instructions: ProgramInstruction[];
}

const PROGRAM_PRESETS: Record<string, AssemblyProgram> = {
  SUM_LOOP: {
    id: 'SUM_LOOP',
    name: 'Accumulator Loop (Sum 1 to 4)',
    description: 'Loops 4 times to compute 4 + 3 + 2 + 1 = 10 into R1.',
    initialRegs: [0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    initialMem: { '0x1000': 0, '0x1004': 0, '0x1008': 0, '0x100C': 0 },
    instructions: [
      {
        pc: 0,
        asm: 'ADDI R1, R0, 0',
        comment: 'Initialize sum (R1) = 0',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[1] = 0;
          return { regs: nextR, mem: m, nextPc: 1, modifiedReg: 1 };
        }
      },
      {
        pc: 1,
        asm: 'ADDI R2, R0, 4',
        comment: 'Initialize counter (R2) = 4',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[2] = 4;
          return { regs: nextR, mem: m, nextPc: 2, modifiedReg: 2 };
        }
      },
      {
        pc: 2,
        asm: 'ADD  R1, R1, R2',
        comment: 'Accumulate: R1 = R1 + R2',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[1] = nextR[1] + nextR[2];
          return { regs: nextR, mem: m, nextPc: 3, modifiedReg: 1 };
        }
      },
      {
        pc: 3,
        asm: 'SUBI R2, R2, 1',
        comment: 'Decrement counter: R2 = R2 - 1',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[2] = Math.max(0, nextR[2] - 1);
          return { regs: nextR, mem: m, nextPc: 4, modifiedReg: 2 };
        }
      },
      {
        pc: 4,
        asm: 'BNE  R2, R0, -2',
        comment: 'If R2 != 0, branch back to ADD (PC = 2)',
        execute: (r, m) => {
          const shouldBranch = r[2] > 0;
          return { regs: r, mem: m, nextPc: shouldBranch ? 2 : 5 };
        }
      }
    ]
  },
  ARRAY_OPS: {
    id: 'ARRAY_OPS',
    name: 'Memory Array Load & Store',
    description: 'Loads values from RAM, computes sum, and writes result back to RAM.',
    initialRegs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    initialMem: { '0x1000': 45, '0x1004': 55, '0x1008': 0, '0x100C': 0 },
    instructions: [
      {
        pc: 0,
        asm: 'LOAD  R1, 0x1000',
        comment: 'Load value 45 from Mem[0x1000] into R1',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[1] = m['0x1000'] || 45;
          return { regs: nextR, mem: m, nextPc: 1, modifiedReg: 1 };
        }
      },
      {
        pc: 1,
        asm: 'LOAD  R2, 0x1004',
        comment: 'Load value 55 from Mem[0x1004] into R2',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[2] = m['0x1004'] || 55;
          return { regs: nextR, mem: m, nextPc: 2, modifiedReg: 2 };
        }
      },
      {
        pc: 2,
        asm: 'ADD   R3, R1, R2',
        comment: 'Compute: R3 = 45 + 55 = 100',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[3] = nextR[1] + nextR[2];
          return { regs: nextR, mem: m, nextPc: 3, modifiedReg: 3 };
        }
      },
      {
        pc: 3,
        asm: 'STORE R3, 0x1008',
        comment: 'Write 100 into Mem[0x1008]',
        execute: (r, m) => {
          const nextM = { ...m, '0x1008': r[3] };
          return { regs: r, mem: nextM, nextPc: 4 };
        }
      }
    ]
  },
  BITWISE_MASK: {
    id: 'BITWISE_MASK',
    name: 'Bitwise Masking & Logic',
    description: 'Applies logical AND and OR bitwise masks across registers.',
    initialRegs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    initialMem: { '0x1000': 0, '0x1004': 0, '0x1008': 0, '0x100C': 0 },
    instructions: [
      {
        pc: 0,
        asm: 'ADDI R1, R0, 0x0F',
        comment: 'R1 = 0x0F (15 in binary: 00001111)',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[1] = 15;
          return { regs: nextR, mem: m, nextPc: 1, modifiedReg: 1 };
        }
      },
      {
        pc: 1,
        asm: 'ADDI R2, R0, 0x09',
        comment: 'R2 = 0x09 (9 in binary: 00001001)',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[2] = 9;
          return { regs: nextR, mem: m, nextPc: 2, modifiedReg: 2 };
        }
      },
      {
        pc: 2,
        asm: 'AND  R3, R1, R2',
        comment: 'R3 = 15 & 9 = 9 (00001001)',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[3] = nextR[1] & nextR[2];
          return { regs: nextR, mem: m, nextPc: 3, modifiedReg: 3 };
        }
      },
      {
        pc: 3,
        asm: 'OR   R4, R1, R2',
        comment: 'R4 = 15 | 9 = 15 (00001111)',
        execute: (r, m) => {
          const nextR = [...r];
          nextR[4] = nextR[1] | nextR[2];
          return { regs: nextR, mem: m, nextPc: 4, modifiedReg: 4 };
        }
      }
    ]
  }
};

// Parser for custom freeform assembly
function parseCustomAssembly(source: string): { instructions: ProgramInstruction[]; error?: string } {
  const lines = source.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
  const instructions: ProgramInstruction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.split('#')[0].trim();
    if (!cleanLine) continue;

    // Tokens: OP arg1, arg2, arg3
    const parts = cleanLine.split(/[\s,]+/);
    const op = parts[0].toUpperCase();

    const parseReg = (name: string): number | null => {
      const match = name.match(/^R(\d+)$/i);
      if (!match) return null;
      const num = parseInt(match[1], 10);
      return num >= 0 && num <= 15 ? num : null;
    };

    const parseImm = (val: string): number => {
      if (val.startsWith('0x') || val.startsWith('0X')) return parseInt(val, 16);
      return parseInt(val, 10);
    };

    if (op === 'ADD' || op === 'SUB' || op === 'AND' || op === 'OR' || op === 'SLT') {
      const rd = parseReg(parts[1]);
      const rs1 = parseReg(parts[2]);
      const rs2 = parseReg(parts[3]);
      if (rd === null || rs1 === null || rs2 === null) {
        return { instructions: [], error: `Line ${i + 1}: Invalid register syntax for ${op}. Use format: ${op} Rd, Rs1, Rs2 (e.g. ${op} R3, R1, R2)` };
      }
      instructions.push({
        pc: instructions.length,
        asm: `${op} R${rd}, R${rs1}, R${rs2}`,
        comment: `${op} operation → R${rd}`,
        execute: (r, m) => {
          const nextR = [...r];
          let val = 0;
          if (op === 'ADD') val = r[rs1] + r[rs2];
          if (op === 'SUB') val = r[rs1] - r[rs2];
          if (op === 'AND') val = r[rs1] & r[rs2];
          if (op === 'OR') val = r[rs1] | r[rs2];
          if (op === 'SLT') val = r[rs1] < r[rs2] ? 1 : 0;
          if (rd !== 0) nextR[rd] = val; // R0 is hardwired to 0
          return { regs: nextR, mem: m, nextPc: i + 1, modifiedReg: rd !== 0 ? rd : undefined };
        }
      });
    } else if (op === 'ADDI' || op === 'SUBI') {
      const rd = parseReg(parts[1]);
      const rs1 = parseReg(parts[2]);
      const imm = parseImm(parts[3]);
      if (rd === null || rs1 === null || isNaN(imm)) {
        return { instructions: [], error: `Line ${i + 1}: Invalid immediate syntax for ${op}. Use format: ${op} Rd, Rs1, Imm (e.g. ${op} R1, R0, 10)` };
      }
      instructions.push({
        pc: instructions.length,
        asm: `${op} R${rd}, R${rs1}, ${parts[3]}`,
        comment: `${op} immediate value ${imm} → R${rd}`,
        execute: (r, m) => {
          const nextR = [...r];
          let val = op === 'ADDI' ? r[rs1] + imm : r[rs1] - imm;
          if (rd !== 0) nextR[rd] = val;
          return { regs: nextR, mem: m, nextPc: i + 1, modifiedReg: rd !== 0 ? rd : undefined };
        }
      });
    } else if (op === 'LOAD') {
      const rd = parseReg(parts[1]);
      const addrStr = parts[2];
      if (rd === null || !addrStr) {
        return { instructions: [], error: `Line ${i + 1}: Invalid syntax for LOAD. Format: LOAD Rd, 0x1000` };
      }
      instructions.push({
        pc: instructions.length,
        asm: `LOAD R${rd}, ${addrStr}`,
        comment: `Read Mem[${addrStr}] → R${rd}`,
        execute: (r, m) => {
          const nextR = [...r];
          const val = m[addrStr] !== undefined ? m[addrStr] : 50;
          if (rd !== 0) nextR[rd] = val;
          return { regs: nextR, mem: m, nextPc: i + 1, modifiedReg: rd !== 0 ? rd : undefined };
        }
      });
    } else if (op === 'STORE') {
      const rs = parseReg(parts[1]);
      const addrStr = parts[2];
      if (rs === null || !addrStr) {
        return { instructions: [], error: `Line ${i + 1}: Invalid syntax for STORE. Format: STORE Rs, 0x1000` };
      }
      instructions.push({
        pc: instructions.length,
        asm: `STORE R${rs}, ${addrStr}`,
        comment: `Write R${rs} → Mem[${addrStr}]`,
        execute: (r, m) => {
          const nextM = { ...m, [addrStr]: r[rs] };
          return { regs: r, mem: nextM, nextPc: i + 1 };
        }
      });
    } else {
      return { instructions: [], error: `Line ${i + 1}: Unsupported opcode '${op}'. Supported: ADD, SUB, ADDI, SUBI, AND, OR, SLT, LOAD, STORE` };
    }
  }

  if (instructions.length === 0) {
    return { instructions: [], error: 'No valid assembly instructions found.' };
  }

  return { instructions };
}

export const InteractiveSimulatorModal: React.FC<InteractiveSimulatorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<SimulatorTab>('SINGLE_INST');

  // Single Instruction State
  const [selectedInst, setSelectedInst] = useState<InstructionType>('ADD');
  const [r1Val, setR1Val] = useState<number>(25);
  const [r2Val, setR2Val] = useState<number>(17);
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Multi-Instruction Program Runner State
  const [activeProgramId, setActiveProgramId] = useState<string>('SUM_LOOP');
  const [programPc, setProgramPc] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [registers, setRegisters] = useState<number[]>(PROGRAM_PRESETS['SUM_LOOP'].initialRegs);
  const [memory, setMemory] = useState<Record<string, number>>(PROGRAM_PRESETS['SUM_LOOP'].initialMem);
  const [lastModifiedReg, setLastModifiedReg] = useState<number | null>(null);
  const [isProgramRunning, setIsProgramRunning] = useState<boolean>(false);

  // Custom Assembly State
  const [customSource, setCustomSource] = useState<string>(
    'ADDI R1, R0, 20\nADDI R2, R0, 22\nADD  R3, R1, R2\nSUB  R4, R3, R1\nSTORE R3, 0x1008'
  );
  const [customInstructions, setCustomInstructions] = useState<ProgramInstruction[]>([]);
  const [customError, setCustomError] = useState<string | null>(null);

  // Reset single instruction state on selection
  useEffect(() => {
    const def = INSTRUCTION_CATALOG[selectedInst];
    setR1Val(def.defaultR1);
    setR2Val(def.defaultR2);
    setStageIndex(0);
    setIsAutoPlaying(false);
  }, [selectedInst]);

  // Reset program runner when switching programs
  useEffect(() => {
    if (activeProgramId === 'CUSTOM') {
      const parsed = parseCustomAssembly(customSource);
      if (parsed.error) {
        setCustomError(parsed.error);
        setCustomInstructions([]);
      } else {
        setCustomError(null);
        setCustomInstructions(parsed.instructions);
      }
      setRegisters([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      setMemory({ '0x1000': 0, '0x1004': 0, '0x1008': 0, '0x100C': 0 });
    } else {
      const prog = PROGRAM_PRESETS[activeProgramId];
      setRegisters([...prog.initialRegs]);
      setMemory({ ...prog.initialMem });
      setCustomError(null);
    }
    setProgramPc(0);
    setCycleCount(0);
    setLastModifiedReg(null);
    setIsProgramRunning(false);
  }, [activeProgramId]);

  // Autoplay loop for single instruction
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setStageIndex((prev) => {
        if (prev >= 4) {
          setIsAutoPlaying(false);
          return prev;
        }
        audio.playStep();
        if (prev + 1 === 3) audio.playAluChime();
        return prev + 1;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Current instructions list based on preset or custom
  const currentInstructions = activeProgramId === 'CUSTOM'
    ? customInstructions
    : PROGRAM_PRESETS[activeProgramId]?.instructions || [];

  // Autoplay loop for Multi-Instruction Program
  useEffect(() => {
    if (!isProgramRunning) return;

    const timer = setInterval(() => {
      setProgramPc((currentPc) => {
        if (currentPc >= currentInstructions.length) {
          setIsProgramRunning(false);
          audio.playAluChime();
          return currentPc;
        }
        const inst = currentInstructions[currentPc];
        audio.playStep();
        setCycleCount((c) => c + 1);

        setRegisters((currentRegs) => {
          setMemory((currentMem) => {
            const res = inst.execute(currentRegs, currentMem);
            if (res.modifiedReg !== undefined) {
              setLastModifiedReg(res.modifiedReg);
            }
            return res.mem;
          });
          const res = inst.execute(currentRegs, memory);
          return res.regs;
        });

        const res = inst.execute(registers, memory);
        return res.nextPc;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isProgramRunning, activeProgramId, currentInstructions, registers, memory]);

  if (!isOpen) return null;

  // Single Instruction calculation
  const currentDef = INSTRUCTION_CATALOG[selectedInst];
  let computedResult = 0;
  let aluFormula = '';
  switch (selectedInst) {
    case 'ADD':
      computedResult = r1Val + r2Val;
      aluFormula = `${r1Val} + ${r2Val} = ${computedResult}`;
      break;
    case 'SUB':
      computedResult = r1Val - r2Val;
      aluFormula = `${r1Val} - ${r2Val} = ${computedResult}`;
      break;
    case 'AND':
      computedResult = r1Val & r2Val;
      aluFormula = `${r1Val} AND ${r2Val} = ${computedResult}`;
      break;
    case 'OR':
      computedResult = r1Val | r2Val;
      aluFormula = `${r1Val} OR ${r2Val} = ${computedResult}`;
      break;
    case 'SLT':
      computedResult = r1Val < r2Val ? 1 : 0;
      aluFormula = `${r1Val} < ${r2Val} → ${computedResult}`;
      break;
    case 'LOAD':
      computedResult = 128;
      aluFormula = `Mem[Base + 0] → Read: ${computedResult}`;
      break;
    case 'STORE':
      computedResult = r2Val;
      aluFormula = `Mem[Base + 0] ← Write: ${r2Val}`;
      break;
    case 'BEQ':
      computedResult = r1Val === r2Val ? 1 : 0;
      aluFormula = `${r1Val} == ${r2Val} → Branch ${computedResult ? 'TAKEN' : 'NOT TAKEN'}`;
      break;
  }

  const rs1Binary = '00001';
  const rs2Binary = '00010';
  const rdBinary = '00011';
  const opcode = currentDef.opcode;
  const funct3 = currentDef.funct3;
  const funct7 = currentDef.funct7 || '0000000';
  const machineCode32 = `${funct7}${rs2Binary}${rs1Binary}${funct3}${rdBinary}${opcode}`;
  const hexCode = '0x' + parseInt(machineCode32, 2).toString(16).toUpperCase().padStart(8, '0');

  const singleStages = [
    {
      name: 'FETCH',
      subtitle: 'Instruction Fetch (IF)',
      action: `Read instruction at PC (0x00400004) from Memory into Instruction Register (IR).`,
      bus: 'PC (0x00400004) ──► Memory Bus ──► IR Latch',
      microOp: ['MAR ← PC', 'IR ← MEM[MAR]', 'PC ← PC + 4']
    },
    {
      name: 'DECODE',
      subtitle: 'Instruction Decode (ID)',
      action: `Control Unit decodes opcode '${opcode}' and signals ALU control for ${selectedInst}.`,
      bus: `IR [31:0] ──► Control Unit Decoder ──► ALU Control (${selectedInst})`,
      microOp: ['Opcode Decoded: ' + selectedInst, 'RegWrite = 1', 'ALUSrc = 0']
    },
    {
      name: 'REG READ',
      subtitle: 'Operand Latch (RR)',
      action: `Dual-port Register File reads R1 (${r1Val}) and R2 (${r2Val}) onto internal Datapath A & B buses.`,
      bus: `RegFile[R1] ──► Bus A (${r1Val}) | RegFile[R2] ──► Bus B (${r2Val})`,
      microOp: [`A_Latch ← R1 (${r1Val})`, `B_Latch ← R2 (${r2Val})`]
    },
    {
      name: 'EXECUTE',
      subtitle: 'ALU Execution (EX)',
      action: `32-Bit Arithmetic Logic Unit performs: ${aluFormula}.`,
      bus: `ALU (Bus A, Bus B) ──► ALU_Out Latch (${computedResult})`,
      microOp: [`ALU_Out ← ${aluFormula}`, `Flags: Z=${computedResult === 0 ? 1 : 0}, N=${computedResult < 0 ? 1 : 0}`]
    },
    {
      name: 'WRITE BACK',
      subtitle: 'Register Write Back (WB)',
      action: selectedInst === 'STORE'
        ? `Memory write completed: address written with value ${r2Val}.`
        : `Result ${computedResult} written back to destination register ${currentDef.defaultDest}.`,
      bus: `ALU_Out (${computedResult}) ──► RegFile Write Port ──► ${currentDef.defaultDest}`,
      microOp: [`${currentDef.defaultDest} ← ${computedResult}`, 'Instruction Retired']
    }
  ];

  // Program Runner Step handler
  const handleProgramStep = () => {
    if (programPc >= currentInstructions.length) return;
    audio.playStep();
    const inst = currentInstructions[programPc];
    setCycleCount((prev) => prev + 1);

    const res = inst.execute(registers, memory);
    setRegisters(res.regs);
    setMemory(res.mem);
    if (res.modifiedReg !== undefined) {
      setLastModifiedReg(res.modifiedReg);
    }
    setProgramPc(res.nextPc);
    if (res.nextPc >= currentInstructions.length) {
      audio.playAluChime();
    }
  };

  const handleProgramReset = () => {
    audio.playClick();
    setIsProgramRunning(false);
    if (activeProgramId === 'CUSTOM') {
      setRegisters([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      setMemory({ '0x1000': 0, '0x1004': 0, '0x1008': 0, '0x100C': 0 });
    } else {
      const prog = PROGRAM_PRESETS[activeProgramId];
      setRegisters([...prog.initialRegs]);
      setMemory({ ...prog.initialMem });
    }
    setProgramPc(0);
    setCycleCount(0);
    setLastModifiedReg(null);
  };

  const handleAssembleCustom = () => {
    audio.playClick();
    const parsed = parseCustomAssembly(customSource);
    if (parsed.error) {
      setCustomError(parsed.error);
      setCustomInstructions([]);
      audio.playCacheMiss();
    } else {
      setCustomError(null);
      setCustomInstructions(parsed.instructions);
      setProgramPc(0);
      setCycleCount(0);
      setLastModifiedReg(null);
      audio.playAluChime();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 6, 8, 0.88)',
        backdropFilter: 'blur(16px)',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1120px',
          maxHeight: '92vh',
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255, 106, 0, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 106, 0, 0.18)',
          borderRadius: '6px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 106, 0, 0.12)',
                border: '1px solid #ff6a00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
            >
              <Cpu size={18} color="#ff6a00" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#ffffff',
                  letterSpacing: '0.04em'
                }}
              >
                INTERACTIVE ARCHITECTURE SANDBOX & DATAPATH LAB
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  color: '#8b949e',
                  letterSpacing: '0.08em'
                }}
              >
                RISC-V / MIPS PROCESSOR SIMULATION, CUSTOM COMPILER & 16-REGISTER BANK
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Top View Mode Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('SINGLE_INST');
            }}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'SINGLE_INST' ? 'rgba(255, 106, 0, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'SINGLE_INST' ? '2px solid #ff6a00' : '2px solid transparent',
              color: activeTab === 'SINGLE_INST' ? '#ff6a00' : '#8b949e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={14} />
            <span>MODE 1: SINGLE INSTRUCTION & 32-BIT MACHINE CODE ENCODER</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('PROGRAM_RUNNER');
            }}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'PROGRAM_RUNNER' ? 'rgba(255, 106, 0, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'PROGRAM_RUNNER' ? '2px solid #ff6a00' : '2px solid transparent',
              color: activeTab === 'PROGRAM_RUNNER' ? '#ff6a00' : '#8b949e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <Code size={14} />
            <span>MODE 2: MULTI-INSTRUCTION PROGRAM RUNNER & CUSTOM COMPILER</span>
          </button>
        </div>

        {/* Modal Body: Switch between Tab 1 and Tab 2 */}
        {activeTab === 'SINGLE_INST' ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Row: Instruction Picker & Operand Inputs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}
            >
              {/* Instruction Selector */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '4px',
                  padding: '14px'
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#ff6a00',
                    letterSpacing: '0.1em',
                    marginBottom: '8px'
                  }}
                >
                  SELECT INSTRUCTION (RISC-V / MIPS ISA)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {(Object.keys(INSTRUCTION_CATALOG) as InstructionType[]).map((inst) => {
                    const isSelected = selectedInst === inst;
                    return (
                      <button
                        key={inst}
                        onClick={() => {
                          audio.playClick();
                          setSelectedInst(inst);
                        }}
                        style={{
                          padding: '8px 2px',
                          background: isSelected ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
                          color: isSelected ? '#000000' : '#ffffff',
                          border: isSelected ? '1px solid #ff6a00' : '1px solid rgba(255, 255, 255, 0.08)',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {inst}
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: '10px',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#8b949e',
                    lineHeight: 1.4
                  }}
                >
                  {currentDef.desc}
                </div>
              </div>

              {/* Operand Inputs */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '4px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#ff6a00',
                    letterSpacing: '0.1em'
                  }}
                >
                  CUSTOM OPERAND VALUES (32-BIT REGISTERS)
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        color: '#6e7681',
                        marginBottom: '4px'
                      }}
                    >
                      R1 (Source 1)
                    </label>
                    <input
                      type="number"
                      value={r1Val}
                      onChange={(e) => {
                        setR1Val(Number(e.target.value));
                        setStageIndex(0);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#090a0d',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        borderRadius: '2px'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        color: '#6e7681',
                        marginBottom: '4px'
                      }}
                    >
                      R2 (Source 2 / Data)
                    </label>
                    <input
                      type="number"
                      value={r2Val}
                      onChange={(e) => {
                        setR2Val(Number(e.target.value));
                        setStageIndex(0);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#090a0d',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '13px',
                        borderRadius: '2px'
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: 'rgba(255, 106, 0, 0.08)',
                    border: '1px solid rgba(255, 106, 0, 0.2)',
                    borderRadius: '2px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#8b949e' }}>Target Latch:</span>
                  <span style={{ color: '#ff6a00', fontWeight: 600 }}>{currentDef.defaultDest}</span>
                </div>
              </div>
            </div>

            {/* Machine Code Binary & Hex Breakdown */}
            <div
              style={{
                background: 'rgba(10, 12, 16, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '4px',
                padding: '14px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#38bdf8',
                    letterSpacing: '0.1em'
                  }}
                >
                  32-BIT MACHINE CODE DECONSTRUCTION (BINARY & HEX)
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ff6a00',
                    background: 'rgba(255, 106, 0, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '2px'
                  }}
                >
                  {hexCode}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '7fr 5fr 5fr 3fr 5fr 7fr',
                  gap: '4px',
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px'
                }}
              >
                <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
                  <div style={{ color: '#8b949e', fontSize: '9px' }}>funct7 [31:25]</div>
                  <div style={{ color: '#f2f4f7', fontWeight: 600 }}>{funct7}</div>
                </div>
                <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
                  <div style={{ color: '#8b949e', fontSize: '9px' }}>rs2 [24:20]</div>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>{rs2Binary}</div>
                </div>
                <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
                  <div style={{ color: '#8b949e', fontSize: '9px' }}>rs1 [19:15]</div>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>{rs1Binary}</div>
                </div>
                <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
                  <div style={{ color: '#8b949e', fontSize: '9px' }}>funct3 [14:12]</div>
                  <div style={{ color: '#e5a93c', fontWeight: 600 }}>{funct3}</div>
                </div>
                <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
                  <div style={{ color: '#8b949e', fontSize: '9px' }}>rd [11:7]</div>
                  <div style={{ color: '#ff6a00', fontWeight: 600 }}>{rdBinary}</div>
                </div>
                <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
                  <div style={{ color: '#8b949e', fontSize: '9px' }}>opcode [6:0]</div>
                  <div style={{ color: '#ef4444', fontWeight: 600 }}>{opcode}</div>
                </div>
              </div>
            </div>

            {/* Stepper & 5-Stage Datapath Walkthrough */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '4px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {singleStages.map((st, idx) => {
                  const isActive = stageIndex === idx;
                  const isPassed = stageIndex > idx;
                  return (
                    <button
                      key={st.name}
                      onClick={() => {
                        audio.playClick();
                        setStageIndex(idx);
                        setIsAutoPlaying(false);
                        if (idx === 3) audio.playAluChime();
                      }}
                      style={{
                        padding: '8px 4px',
                        background: isActive
                          ? '#ff6a00'
                          : isPassed
                          ? 'rgba(255, 106, 0, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isActive ? '#000' : isPassed ? '#ff6a00' : '#8b949e',
                        border: isActive
                          ? '1px solid #ff6a00'
                          : isPassed
                          ? '1px solid rgba(255, 106, 0, 0.3)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderRadius: '2px',
                        textAlign: 'center'
                      }}
                    >
                      <div>{st.name}</div>
                      <div style={{ fontSize: '9px', opacity: 0.8 }}>STAGE 0{idx + 1}</div>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  background: '#0a0c0f',
                  border: '1px solid rgba(255, 106, 0, 0.3)',
                  borderRadius: '4px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}
                  >
                    {singleStages[stageIndex].subtitle}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#ff6a00'
                    }}
                  >
                    CYCLE 0{stageIndex + 1}
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: '#d0d7de',
                    lineHeight: 1.5
                  }}
                >
                  {singleStages[stageIndex].action}
                </p>

                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '2px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <ArrowRight size={13} color="#ff6a00" />
                  <span>{singleStages[stageIndex].bus}</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      audio.playClick();
                      setIsAutoPlaying(!isAutoPlaying);
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                  >
                    {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{isAutoPlaying ? 'PAUSE' : 'AUTO PLAY'}</span>
                  </button>

                  <button
                    onClick={() => {
                      audio.playStep();
                      const nextIdx = (stageIndex + 1) % 5;
                      setStageIndex(nextIdx);
                      if (nextIdx === 3) audio.playAluChime();
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                  >
                    <SkipForward size={12} />
                    <span>STEP FORWARD</span>
                  </button>

                  <button
                    onClick={() => {
                      audio.playClick();
                      setIsAutoPlaying(false);
                      setStageIndex(0);
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '11px' }}
                    title="Reset Stage to 1"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#8b949e'
                  }}
                >
                  RESULT LATCH: <span style={{ color: '#ffffff', fontWeight: 600 }}>{stageIndex === 4 ? computedResult : '(PENDING)'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Mode 2: Multi-Instruction Program Runner & Custom Assembly Compiler */
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Toolbar: Program Selector & Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '14px 18px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#ff6a00' }}>
                  ROUTINE:
                </span>
                <select
                  value={activeProgramId}
                  onChange={(e) => {
                    audio.playClick();
                    setActiveProgramId(e.target.value);
                  }}
                  style={{
                    background: '#090a0d',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '2px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px'
                  }}
                >
                  {Object.values(PROGRAM_PRESETS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="CUSTOM">★ Custom Code (Live Assembly Compiler)</option>
                </select>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => {
                    audio.playClick();
                    setIsProgramRunning(!isProgramRunning);
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '11px' }}
                >
                  {isProgramRunning ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isProgramRunning ? 'PAUSE' : 'RUN ROUTINE'}</span>
                </button>

                <button
                  onClick={handleProgramStep}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '11px' }}
                  title="Execute Current Instruction & Advance PC"
                >
                  <SkipForward size={12} />
                  <span>STEP INSTRUCTION</span>
                </button>

                <button
                  onClick={handleProgramReset}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '11px' }}
                  title="Reset Program to Start"
                >
                  <RotateCcw size={12} />
                </button>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginLeft: '8px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: '#8b949e' }}>
                    PC: <strong style={{ color: '#ff6a00' }}>0x{(0x00400000 + programPc * 4).toString(16).toUpperCase()}</strong>
                  </span>
                  <span style={{ color: '#8b949e' }}>
                    CYCLES: <strong style={{ color: '#38bdf8' }}>{cycleCount}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Assembly Editor Box (shown if CUSTOM is selected) */}
            {activeProgramId === 'CUSTOM' && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 106, 0, 0.3)',
                  borderRadius: '4px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#ff6a00' }}>
                    CUSTOM ASSEMBLY CODE EDITOR (INPUT YOUR INSTRUCTIONS)
                  </div>
                  <button
                    onClick={handleAssembleCustom}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '11px' }}
                  >
                    <span>ASSEMBLE & LOAD ROUTINE</span>
                  </button>
                </div>

                <textarea
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  rows={5}
                  placeholder="Enter assembly instructions..."
                  style={{
                    width: '100%',
                    background: '#090a0d',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '3px',
                    color: '#f2f4f7',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    lineHeight: '1.6',
                    padding: '10px 12px',
                    resize: 'vertical'
                  }}
                />

                {customError ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#f87171',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '2px',
                      border: '1px solid rgba(239, 68, 68, 0.25)'
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>{customError}</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#4ade80',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{customInstructions.length} instructions assembled successfully. Ready to execute!</span>
                  </div>
                )}
              </div>
            )}

            {/* Main Program View: Left Code Editor / Right Register & Memory Banks */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '16px'
              }}
            >
              {/* Left Column: Instruction Listing */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: '#8b949e',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingBottom: '8px'
                  }}
                >
                  <span>PC ADDR // INSTRUCTION</span>
                  <span>OPERATION & COMMENT</span>
                </div>

                {currentInstructions.map((inst, idx) => {
                  const isCurrent = programPc === idx;
                  const isPast = programPc > idx;

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: isCurrent
                          ? 'rgba(255, 106, 0, 0.15)'
                          : isPast
                          ? 'rgba(255, 255, 255, 0.02)'
                          : 'transparent',
                        border: isCurrent
                          ? '1px solid #ff6a00'
                          : '1px solid transparent',
                        borderRadius: '3px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            color: isCurrent ? '#ff6a00' : '#57606a',
                            fontSize: '11px',
                            minWidth: '24px'
                          }}
                        >
                          {isCurrent ? '►' : `0${idx}`}
                        </span>
                        <span
                          style={{
                            color: isCurrent ? '#ffffff' : '#9aa3af',
                            fontWeight: isCurrent ? 700 : 400
                          }}
                        >
                          {inst.asm}
                        </span>
                      </div>
                      <span
                        style={{
                          color: isCurrent ? '#ff6a00' : '#6e7681',
                          fontSize: '11px'
                        }}
                      >
                        {inst.comment}
                      </span>
                    </div>
                  );
                })}

                {/* Routine completed banner */}
                {programPc >= currentInstructions.length && currentInstructions.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '2px',
                      color: '#4ade80',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      textAlign: 'center'
                    }}
                  >
                    ✓ ROUTINE COMPLETED // ALL INSTRUCTIONS RETIRED
                  </div>
                )}
              </div>

              {/* Right Column: 16-Register Bank & Data Memory */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* 16-Register Bank (R0 -> R15) */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#ff6a00'
                    }}
                  >
                    <span>16-REGISTER BANK (R0 - R15)</span>
                    <span style={{ fontSize: '9px', color: '#8b949e' }}>R0 = HARDWIRED 0</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px'
                    }}
                  >
                    {registers.map((val, rIdx) => {
                      const isModified = lastModifiedReg === rIdx;
                      return (
                        <div
                          key={rIdx}
                          style={{
                            padding: '6px 8px',
                            background: isModified ? 'rgba(255, 106, 0, 0.2)' : '#14171d',
                            border: `1px solid ${isModified ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '2px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ color: '#8b949e', fontSize: '9px' }}>R{rIdx}</div>
                          <div style={{ color: isModified ? '#ff6a00' : '#ffffff', fontWeight: 600 }}>
                            {val}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Memory Segment (0x1000 -> 0x100C) */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '14px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      color: '#38bdf8'
                    }}
                  >
                    <Database size={13} />
                    <span>DATA MEMORY SEGMENT (SRAM)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {Object.entries(memory).map(([addr, val]) => (
                      <div
                        key={addr}
                        style={{
                          padding: '6px 8px',
                          background: '#14171d',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '2px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ color: '#8b949e', fontSize: '9px' }}>{addr}</div>
                        <div style={{ color: '#38bdf8', fontWeight: 600 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
