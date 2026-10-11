# SILT-GUARD AI 🌊

### Intelligent Hydro-Silt, Flood Risk & Automated Sluice-Gate Management System

SILT-GUARD AI is a software-based intelligent flood and hydro-silt management system designed to monitor changing water and sediment conditions, assess structural risk, predict the time to a critical water stage, and automatically determine sluice-gate operation.

The system combines simulated real-time telemetry with physics-based calculations, risk analysis, safety rules, and an interactive dashboard to create a complete digital decision-support and control pipeline.

> **Current Prototype:** Software-only implementation using simulated sensor telemetry. The architecture is designed so that simulated sensors can later be replaced with real sensor hardware without changing the core decision engine.

---

## 🚨 Problem Statement

Flood and hydro-silt conditions can change rapidly due to increasing water levels, discharge, sediment concentration, and rate of rise.

Traditional monitoring systems mainly focus on observing parameters such as water level or flow. However, monitoring alone does not provide a complete mechanism for deciding:

- How severe the current situation is
- How quickly the system is approaching a critical stage
- When sluice gates should be opened
- How much the gates should be opened
- What to do when a gate becomes jammed
- How to continue operating when cloud connectivity is unavailable

SILT-GUARD AI addresses these challenges by connecting monitoring, risk assessment, prediction, and gate-control decisions into a single software pipeline.

---

## 💡 Our Solution

SILT-GUARD AI follows a closed-loop approach:

```text
Simulated Sensors
       ↓
Telemetry Processing
       ↓
Physics Engine
       ↓
Risk Engine
       ↓
EFI + Time-to-Breach
       ↓
Gate Control Engine
       ↓
Safety & Emergency Overrides
       ↓
Live Dashboard
````

Instead of simply displaying sensor values, the system converts incoming data into actionable risk information and gate-control decisions.

---

## ✨ Key Features

### 1. Real-Time Sensor Simulation

The prototype simulates important environmental parameters:

* Water Stage / Depth
* Discharge
* Suspended Sediment Concentration (SSC)
* Rate of Rise

This allows the complete system to be demonstrated without physical sensor hardware.

---

### 2. Physics-Based Calculations

The system calculates important physical quantities from the telemetry.

#### Slurry Density

```text
ρ_slurry = ρ_water + SSC × (1 - 1/Gs)
```

where:

* `ρ_water = 1000 kg/m³`
* `Gs = 2.65`
* SSC is converted from ppm to kg/m³

#### Hydrostatic Pressure

```text
P = ρ × g × h
```

#### Sediment Transport

Discharge is converted from cubic feet per second (cusecs) to cubic metres per second before calculating sediment transport.

---

## 📊 Embankment Failure Index (EFI)

SILT-GUARD AI uses an **Embankment Failure Index (EFI)** ranging from `0–100`.

The index combines:

* Water stage
* Discharge
* Suspended sediment concentration
* Rate of rise

The current weighted formulation is:

```text
EFI = 100 ×
(
    0.40 × Stage Factor +
    0.20 × Discharge Factor +
    0.15 × Sediment Factor +
    0.25 × Rise Factor
)
```

The resulting score is used as a **risk and control index**, not as a percentage probability of failure.

---

## ⏱️ Time-to-Breach (TTB)

The system estimates the approximate time required for the water level to reach the critical stage of `12 m`.

When the water level is rising sufficiently:

```text
TTB = ((12 - depth) / rise_rate) × 60
```

The result is displayed in minutes.

A particularly important safety condition is:

```text
If TTB < 30 minutes
        ↓
Force gate opening to 100%
```

This provides an emergency override when the system is approaching the critical stage rapidly.

---

## 🚪 Automated Gate Control

The gate-control engine maps the EFI to a gate opening level.

| EFI     | Gate Opening |
| ------- | ------------ |
| `< 30`  | 0%           |
| `30–59` | 25%          |
| `60–79` | 50%          |
| `80–89` | 75%          |
| `≥ 90`  | 100%         |

### Emergency Override

If:

```text
TTB < 30 minutes
```

the system forces:

```text
Gate = 100%
```

regardless of the normal EFI-based gate position.

---

## 🛡️ Safety Floors

The system includes hard safety conditions based on water depth.

```text
Depth ≥ 9.0 m   → EFI minimum 60
Depth ≥ 10.5 m  → EFI minimum 90
Depth ≥ 12.0 m  → EFI = 100
```

This prevents the risk score from becoming artificially low during critical water-stage conditions.

---

## 🔄 Hysteresis

Gate control can experience unnecessary switching if the risk value moves around a threshold.

SILT-GUARD AI uses a hysteresis concept so that the gate does not immediately reduce its opening whenever the EFI drops slightly below a trigger value.

The purpose is to prevent:

* Rapid gate oscillation
* Unnecessary actuator movement
* Unstable control decisions

---

## ⚙️ Sediment-Aware Gate Protection

High sediment concentration can affect mechanical gate operation.

The system therefore includes an anti-jam concept based on motor current monitoring.

If motor current exceeds the defined threshold:

```text
Motor Current > 12 A
```

the system can identify a potential gate jam and initiate a recovery sequence involving:

1. Jam detection
2. Scour jet activation
3. Flush strokes
4. Return toward the commanded gate position

This is designed to address sediment-related mechanical problems rather than treating the flood problem as purely hydraulic.

---

## 🔋 Off-Grid / Local Operation

A major design goal of SILT-GUARD AI is reducing dependence on continuous cloud connectivity.

The decision-making architecture is designed around local processing so that critical calculations can continue without requiring a remote cloud service.

The broader system design also considers:

* Battery storage
* Hydrokinetic generation
* Energy availability
* Low-power operation
* Fail-safe mechanisms

---

## 🖥️ Live Digital Twin Dashboard

The frontend provides a live dashboard for visualizing the simulated system.

The dashboard displays:

* Discharge
* Suspended Sediment Concentration
* Water Stage
* Rate of Rise
* EFI
* Alert Status
* Time-to-Breach
* Gate Position
* Motor Current
* Battery Level
* Power Information
* System Controls

The dashboard communicates with the backend through WebSocket telemetry.

---

## 🏗️ System Architecture

```text
                    SILT-GUARD AI
                         │
                         ▼
              ┌─────────────────────┐
              │ Simulated Sensors   │
              │                     │
              │ • Water Level       │
              │ • Discharge         │
              │ • SSC               │
              │ • Rate of Rise      │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Telemetry Processor │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Physics Engine    │
              │                     │
              │ • Slurry Density    │
              │ • Pressure          │
              │ • Sediment Transport│
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     Risk Engine     │
              │                     │
              │ • EFI               │
              │ • Safety Floors     │
              │ • TTB               │
              │ • Alert State       │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Gate Control Engine│
              │                     │
              │ • Auto Control      │
              │ • Emergency Override│
              │ • Hysteresis        │
              │ • Manual Control    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Live Dashboard    │
              │      React UI       │
              └─────────────────────┘
```

---

## 🧩 Technology Stack

### Backend

* Python
* FastAPI
* Uvicorn
* WebSockets

### Frontend

* React
* JavaScript
* Vite
* HTML
* CSS

### Core Concepts

* Physics-based modelling
* Risk scoring
* Real-time telemetry
* Digital twin simulation
* Rule-based control
* WebSocket communication
* Safety-critical decision logic

---

## 📁 Project Structure

```text
SILT-GUARD AI/
│
├── backend/
│   ├── main.py
│   ├── engine.py
│   ├── requirements.txt
│   └── venv/
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   │
│   └── src/
│       ├── main.jsx
│       └── style.css
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed:

* Python 3.12+
* Node.js
* npm
* Git

---

# 🔧 Backend Setup

Open a terminal and navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Install the required Python packages:

```bash
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn websockets
```

Start the backend server:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

# 🎨 Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

If PowerShell blocks `npm.ps1`, use:

```bash
npm.cmd run dev
```

The frontend will normally be available at:

```text
http://localhost:5173/
```

Open the URL in your browser.

---

## 🔌 WebSocket Communication

The frontend receives live telemetry from the backend through:

```text
ws://127.0.0.1:8000/ws/telemetry
```

The backend continuously generates telemetry and sends updated system information to connected dashboard clients.

---

## 🎮 Control Modes

The dashboard provides manual and automatic control options.

### Manual Mode

The operator can select:

```text
0%
25%
50%
75%
100%
```

gate opening.

### Automatic Mode

The system calculates the gate position based on:

* EFI
* Time-to-Breach
* Safety floors
* Control rules

### Jam Testing

The prototype also provides a test mechanism to simulate a gate-jam condition and demonstrate the protection logic.

---

## 🚦 Alert Classification

The system classifies the current condition based on EFI.

| EFI        | Status      |
| ---------- | ----------- |
| `< 30`     | NORMAL      |
| `30–59.99` | WATCH       |
| `60–79.99` | WARNING     |
| `80–89.99` | CRITICAL    |
| `≥ 90`     | BREACH_RISK |

---

## 🧪 Software-Only Prototype

The current version is intentionally implemented as a software prototype.

Instead of connecting physical sensors, the system generates simulated telemetry representing changing flood and hydro-silt conditions.

This allows us to validate:

```text
Sensor Data
     ↓
Physics Calculations
     ↓
Risk Assessment
     ↓
Prediction
     ↓
Gate Decision
     ↓
Dashboard
```

The sensing layer is separated from the decision engine so that real sensor data can be integrated in a future hardware deployment.

---

## 🔮 Future Scope

Future versions can extend the system with:

* ESP32-based sensor nodes
* Real water-level sensors
* Real discharge/flow sensors
* Optical/acoustic sediment sensors
* LoRa communication
* Extended Kalman Filter-based sensor fusion
* Physical sluice-gate actuator
* Real motor-current monitoring
* Real scour-jet control
* Secure device authentication
* Encrypted telemetry
* Role-based access control
* Persistent telemetry storage
* Advanced hydrodynamic simulation
* Machine-learning-based forecasting
* Rainfall and upstream inflow integration
* Multi-gate coordination
* Geospatial flood visualization

---

## ⚠️ Current Limitations

The current hackathon prototype has several limitations:

1. It uses simulated sensor data instead of physical hardware.
2. The hydrodynamic model is simplified for real-time software demonstration.
3. EFI is a normalized risk/control index and should not be interpreted as an actual probability of embankment failure.
4. Real-world deployment would require sensor validation and calibration.
5. Physical actuator integration would require extensive safety testing.
6. Production deployment would require stronger cybersecurity and communication security.
7. Environmental conditions are more complex than the parameters represented in the current prototype.

These limitations are considered part of the transition from a software prototype to a real-world deployment system.

---

## 🎯 Why SILT-GUARD AI?

Most monitoring systems answer:

> **"What is happening?"**

SILT-GUARD AI aims to answer:

> **"What is happening, how risky is it, how quickly are we approaching a critical condition, and what action should the gate-control system take?"**

The core idea is to connect:

**Monitoring → Physics → Risk → Prediction → Action**

in a single system.

---

## 👥 Team

**SILT-GUARD AI Team**

Developed as a hackathon project focused on intelligent flood, hydro-silt, risk-analysis, and automated gate-management solutions.

---

## 📜 Disclaimer

SILT-GUARD AI is currently a research/hackathon prototype and has not been validated for deployment in real flood-control infrastructure.

Real-world deployment would require:

* Field testing
* Sensor calibration
* Hydraulic validation
* Mechanical validation
* Safety certification
* Cybersecurity validation
* Regulatory approval
* Extensive fail-safe testing

---

## ⭐ Project Vision

The long-term vision of SILT-GUARD AI is to develop a resilient local decision system capable of combining environmental sensing, hydraulic analysis, sediment awareness, predictive risk assessment, and automated infrastructure control.

> **Sense → Understand → Predict → Act → Protect**

```

### One important GitHub tip

For your repository, I would **not** call it simply `flood-management-system`. A stronger repo name would be:

**`SILT-GUARD-AI`**

or

**`SILT-GUARD-AI-Digital-Twin`**

The second one is particularly good for a hackathon because it immediately tells a reviewer that your project is a **digital-twin/software simulation**, rather than pretending you have deployed physical hardware.
```
