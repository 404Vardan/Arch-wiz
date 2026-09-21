# ARCH-VIZ: Interactive 3D CPU Architecture & Performance Analyzer

> **"Don't just read CPU architecture. SEE how the processor works."**

ARCH-VIZ is a cinematic, interactive 3D **educational CPU architecture visualization and simulation environment** designed for **Computer Organization and Architecture (COA)** curricula and Project-Based Learning (PBL). Built with React, Three.js / React Three Fiber, and TypeScript, it provides students, educators, and engineers with an observable, real-time microarchitectural model of processor execution, memory hierarchies, pipeline dynamics, and performance laws.

---

## 🏛️ Architectural Model & Design Principles

To provide maximum pedagogical clarity without compromising technical rigor, ARCH-VIZ adheres to the following principles:

1. **Educational RISC-V (RV32I-Inspired) ISA**:
   - Instructions follow standardized 32-bit RISC-V field layouts: `opcode [6:0]`, `rd [11:7]`, `funct3 [14:12]`, `rs1 [19:15]`, `rs2 [24:20]`, and `funct7 [31:25]` or immediates (`imm[11:0]`).
   - Opcode classifications: R-Type (`0110011`), I-Type (`0010011` / `0000011`), S-Type (`0100011`), and B-Type (`1100011`).
2. **Datapath vs. Pipeline Stage Alignment**:
   - **Single-Instruction Datapath Flow**: Separates Register Read ($RR$) visually ($IF \to ID \to RR \to EX \to WB$) to make dual-port operand movement from the register file onto internal datapath buses transparent to learners.
   - **Synchronous Pipeline Model**: Adheres to the canonical 5-stage RISC pipeline ($IF \to ID \to EX \to MEM \to WB$) where operand fetch occurs concurrently during Instruction Decode ($ID$).
3. **Deterministic State Transitions**:
   - The multi-instruction execution engine models state strictly as:
     $$\text{Old CPU State } (R, M, PC) \xrightarrow{\text{Instruction Execution}} \text{New CPU State } (R', M', PC')$$
     ensuring side-effect isolation and reproducible cycle-by-cycle tracing.

---

## ⚡ Key Features

### 1. Cinematic 3D Hardware Teardown (`0.0 → 1.0` Timeline)
- **Unibody CNC Aluminum Laptop**: Smoothly pivots open on a mechanical dual-barrel hinge driven by scroll progress.
- **Dynamic Silicon Display**: Real-time canvas telemetry displaying block schematics and bus activity.
- **Retractable Keyboard Deck**: Disassembles forward to reveal motherboard traces and the CPU die.
- **Exploded 3D Silicon Package**: 8 modular blocks (`ALU`, `REGISTER FILE`, `CONTROL UNIT`, `PC`, `IR`, `MEMORY`, `CACHE`, `PIPELINE`) separate vertically in 3D space with interactive inspection drawers.

### 2. 5-Stage Datapath Instruction Stepper (`ADD R1, R2`)
- Step or auto-play through micro-operations:
  - **Fetch (IF)**: $PC$ address latched onto Memory Bus $\to$ Instruction Register ($IR$).
  - **Decode (ID)**: Control Unit decodes opcode `0x33` (`0110011`) and asserts datapath control lines.
  - **Register Read (RR)**: Dual-port read of source registers $rs_1=R_1$ ($20$) and $rs_2=R_2$ ($22$).
  - **Execute (EX)**: 32-bit parallel ALU adder computes result ($42$).
  - **Write Back (WB)**: Destination register latch updated ($R_3 \leftarrow 42$).

### 3. Interactive Architecture Sandbox & 32-Bit Machine Code Encoder
- **Instruction Support**: `ADD`, `SUB`, `AND`, `OR`, `SLT`, `ADDI`, `SUBI`, `LOAD`, `STORE`, `BEQ`, `BNE`.
- **Live 32-Bit Bitfield Deconstruction**: Colored breakdown of RISC-V fields (`funct7`, `rs2`, `rs1`, `funct3`, `rd`, `opcode`) and synchronized hexadecimal representation (e.g. `0x011081B3`).
- **Interactive Operand Inputs**: Customize operand registers, immediate constants, and memory offsets.

### 4. Multi-Instruction Program Runner & 16-Register Bank
- **Curated Educational Presets**:
  - *Accumulator Loop*: Demonstrates iterative summation ($1 \to 4$) using loop counters and branch conditions.
  - *Memory Array Load & Store*: Illustrates SRAM read/write operations with pointer arithmetic.
  - *Bitwise Masking & Logic*: Visualizes bitfield filtering and masking operations.
- **16-Register Bank ($R_0 \to R_{15}$)**: Real-time register state table with writeback pulse animations ($R_0$ hardwired to $0$).
- **SRAM Data Memory Segment**: Visual table of data memory addresses (`0x1000`–`0x100C`).

### 5. Freeform Custom Assembly Lexer & Interactive Compiler
- **Built-in Parser**: Assembles user-written assembly code into executable microarchitectural instructions.
- **Supported Operations**: `ADD`, `SUB`, `ADDI`, `SUBI`, `AND`, `OR`, `SLT`, `LOAD`, `STORE`, `BEQ`, `BNE`, `NOP`.
- **Immediate Syntax Diagnostics**: Real-time syntax and range validation with informative error messages.
- **Step & Run Modes**: Single-step execution with pointer arrow updates or continuous execution.

### 6. Memory Cache Matrix & Address Deconstruction
- **32-Bit Address Breakdown**: Segmented into `TAG [31:16]`, `SET INDEX [15:2]`, and `BYTE OFFSET [1:0]`.
- **Live Cache Line Matrix**: Visualizes sets $S_0$ through $S_3$ with valid bits, tags, and cached data blocks.
- **Hit vs Miss Simulation**: Interactive **Test Cache Miss** (triggers RAM fetch and line refill) and **Test Cache Hit** (instantaneous SRAM match) with real-time hit-rate tracking.

### 7. Pipeline Hazard Analyzer & Forwarding Bypass
- **3 Hazard Modes**:
  - `IDEAL`: 1 instruction per cycle ($\text{CPI} = 1.0$).
  - `DATA HAZARD (2 STALLS)`: Visualizes Read-After-Write (RAW) data dependency with inserted `NOP` bubbles.
  - `WITH FORWARDING (BYPASS)`: Visualizes hardware bypass multiplexers routing `EX/MEM.ALUOut` directly to ALU inputs at Cycle 4, eliminating stall cycles.

### 8. 2-Bit Saturating Branch Predictor (Control Hazards)
- **4-State Finite State Machine (FSM)**:
  - `00`: Strongly Not Taken (SNT)
  - `01`: Weakly Not Taken (WNT)
  - `10`: Weakly Taken (WT)
  - `11`: Strongly Taken (ST)
- **Hysteresis Visualization**: Prevents branch misprediction flushes on anomalous loop iterations.
- **Speculative Execution & Flush Accounting**: Tracks prediction hits ($0$ penalty bubbles) vs misprediction flushes ($2$ stall bubbles inserted into $IF$/$ID$).

### 9. Quantitative Performance Benchmark & Amdahl's Law Calculator
- **Dual Performance Formulations**:
  1. **The Iron Law of Processor Performance**:
     $$\text{Execution Time } T = I \times \text{CPI} \times t_{\text{clk}}$$
     Compares Single-Cycle ($850\,\text{ps}$), Multi-Cycle ($200\,\text{ps}$), and Pipelined ($220\,\text{ps}$) datapaths with adjustable Instruction Count ($I$), Cache Miss %, and Branch Hazard %.
  2. **Amdahl's Law Calculator**:
     $$\text{Speedup} = \frac{1}{(1 - f) + \frac{f}{s}}$$
     Interactive sliders for enhanced execution fraction $f$ ($0\% \to 95\%$) and accelerator speedup factor $s$ ($1\text{x} \to 16\text{x}$), demonstrating theoretical system limits ($\frac{1}{1 - f}$).

### 10. COA Knowledge Mastery Lab (Interactive Quiz)
- Conceptual questions covering effective address calculation, forwarding bypass paths, cache mapping, register file dual-read ports, and branch prediction with instant rationale feedback.

### 11. Zero-Dependency Web Audio Synthesizer
- Built using the native Web Audio API (tactile mechanical clicks, datapath transition sweeps, dual-harmonic ALU chime, cache hit/miss audio cues, and navbar mute toggle).

---

## 🛠️ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Styling**: Vanilla CSS with custom design tokens & dark glassmorphism
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: Native Web Audio API (zero external audio files)
- **CI/CD**: GitHub Actions automated deployment to GitHub Pages

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/404Vardan/Arch-wiz.git
cd Arch-wiz

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📚 Academic Alignment

ARCH-VIZ is built specifically for **Computer Organization and Architecture (COA)** curricula and Project-Based Learning (PBL). It maps directly to core topics covered in:
- *Computer Organization and Design: The Hardware/Software Interface (RISC-V Edition)* — Patterson & Hennessy
- *Computer Architecture: A Quantitative Approach* — Hennessy & Patterson

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
