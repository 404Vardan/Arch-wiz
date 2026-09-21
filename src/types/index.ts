export type ComponentId = 
  | 'PC' 
  | 'IR' 
  | 'CU' 
  | 'REG_FILE' 
  | 'ALU' 
  | 'MEMORY' 
  | 'CACHE' 
  | 'PIPELINE';

export interface CPUComponentData {
  id: ComponentId;
  name: string;
  fullName: string;
  category: string;
  description: string;
  position: [number, number, number];
  explodedPosition: [number, number, number];
  size: [number, number, number];
  color: string;
  role: string;
  techSpecs: { label: string; value: string }[];
  connections: ComponentId[];
}

export type ExecutionStage = 
  | 'FETCH' 
  | 'DECODE' 
  | 'REGISTER_READ' 
  | 'EXECUTE' 
  | 'WRITE_BACK';

export interface StageInfo {
  id: ExecutionStage;
  number: string;
  title: string;
  description: string;
  activeComponents: ComponentId[];
  dataFlowDescription: string;
  busPath: [ComponentId, ComponentId][];
  microOps: string[];
  cpuState: {
    pc: string;
    ir: string;
    r1: number;
    r2: number;
    r3: number;
    aluOp: string;
    aluResult: number | null;
    status: string;
  };
}

export type CacheFlowType = 'HIT' | 'MISS' | null;

export interface PipelineCycle {
  cycle: number;
  i1: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | '-';
  i2: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | '-';
  i3: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | '-';
  activeStage: string;
  description: string;
}
