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

### 1. Mutually Exclusive Scene Timeline & 3D Hardware Teardown
- **Synchronized Camera Timeline**:
  - `0.00–0.12`: Cinematic Landing Hero
  - `0.12–0.45`: Laptop opening and internal hardware reveal
  - `0.45–0.65`: Exploded CPU architecture with focus-based 3D HUD labeling & compact Component Index
  - `0.65–0.80`: 5-stage instruction execution datapath
  - `0.80–0.89`: Memory hierarchy & cache access flow
  - `0.89–0.95`: Pipeline lanes, hazards, and branch predictor
  - `0.95–1.00`: Final overview & full-screen Simulation Lab entry
- **Zero-Overlap Educational Layout**: Docked responsive overlay panels with mutually exclusive visibility guards ensuring explanations, controls, and 3D silicon never obstruct each other.
- **Focus-Based 3D HUD Labels**: Eliminates label clutter by only projecting labels on selected, hovered, or actively highlighted components.
- **Compact Component Index**: Quick-jump index for all 8 microarchitectural blocks (`PC`, `IR`, `CU`, `REG_FILE`, `ALU`, `MEMORY`, `CACHE`, `PIPELINE`).

### 2. 5-Stage Datapath Instruction Stepper (`ADD x3, x1, x2`)
- **Live SVG Datapath Route**: Highlights the active component path ($PC \to \text{Memory} \to IR \to CU \to \text{Register File} \to ALU \to \text{Register File}$) with animated micro-operation vectors and transferred values.
- **Strict Educational State**:
  - **Fetch (IF)**: $PC = \text{0x0040}$ latched onto Memory Bus $\to$ Instruction word returned to Instruction Register ($IR$).
  - **Decode (ID)**: Control Unit decodes opcode `0110011` (`0x33`), asserts `ALUOp = ADD`, `RegWrite = 1`, and exposes RISC-V fields (`rs1=x1`, `rs2=x2`, `rd=x3`).
  - **Register Read (RR)**: Dual-port read of source registers $rs_1=x_1$ ($20$) and $rs_2=x_2$ ($22$) independently entering ALU inputs A and B.
  - **Execute (EX)**: 32-bit parallel ALU adder computes $20 + 22 = 42$; destination register $x_3$ strictly remains $0$ during this stage.
  - **Write Back (WB)**: Result ($42$) routed across writeback bus to Register File; destination register transitions $x_3: 0 \to 42$.
- **4-Part Instructional Structure**: Consistent pedagogical layout on every stage: *What is happening*, *Visual flow*, *Current values*, and *Why it matters*.

### 3. Interactive Architecture Sandbox & 32-Bit Machine Code Encoder
- **Instruction Support**: `ADD`, `SUB`, `AND`, `OR`, `SLT`, `ADDI`, `SUBI`, `LOAD`, `STORE`, `BEQ`, `BNE`.
- **Tri-Synchronized Views**:
  1. Assembly Syntax (`ADD x3, x1, x2`)
  2. Machine-Code Bitfield Deconstruction (`funct7`, `rs2`, `rs1`, `funct3`, `rd`, `opcode` and hex word)
  3. Control Hardware Interpretation (decoded signals, ALU function, active register indices)
- **Pedagogical Scope**: Clearly identifies the implemented educational RV32I subset.

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

### 6. Memory Cache Subsystem & Access Flow
- **Memory Access Flowchart**: Interactive SVG visualizes CPU request $\to$ L1 lookup $\to$ Hit return OR Miss $\to$ Main Memory refill $\to$ CPU.
- **Live 32-Bit Address Breakdown**: Mathematically calculated from selected address:
  - `TAG [31:4]`: Upper 28 address bits checked against cache directory.
  - `SET INDEX [3:2]`: 2 bits indexing 1 of 4 sets ($S_0$ through $S_3$).
  - `BYTE OFFSET [1:0]`: 2 bits selecting the byte within the 4-byte line.
- **Live Cache Line Matrix**: Visualizes sets with valid bits, tags, and cached data blocks.
- **Hit vs Miss Simulation**: Interactive **Test Cache Miss** (triggers RAM fetch and line refill) and **Test Cache Hit** (instantaneous SRAM match) with real-time hit-rate tracking.

### 7. Pipeline Multi-Instruction Lanes & Hazard Forwarding
- **Clock-Cycle Timing Lanes**: Multi-instruction cycle grid ($I_1, I_2, I_3$ over Cycles 1–8) displaying instruction positions, active stages, stalls, and forwarding bypasses.
- **3 Comparative Modes**:
  - `IDEAL`: 1 instruction completed per cycle ($\text{CPI} = 1.0$).
  - `DATA HAZARD (2 STALLS)`: Visualizes Read-After-Write (RAW) data dependency with inserted `NOP` bubble cycles.
  - `WITH FORWARDING (BYPASS)`: Visualizes hardware bypass multiplexer routing `EX/MEM.ALUOut` directly to ALU inputs at Cycle 4, eliminating stall cycles.

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
