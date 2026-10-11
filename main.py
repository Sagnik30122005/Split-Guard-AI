import asyncio
import math
import random
import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from engine import (
    calculate_slurry_density,
    calculate_hydrostatic_pressure,
    calculate_sediment_transport,
    calculate_efi,
    calculate_ttb,
    get_alert_state,
    calculate_gate_control
)


app = FastAPI(
    title="SILT-GUARD AI",
    version="2.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


clients = set()

manual_mode = False
manual_gate = 0

jam_detected = False
scour_active = False

start_time = time.time()


def generate_sensor_data():

    elapsed = time.time() - start_time

    wave = math.sin(elapsed / 15)

    water_depth = 6.5 + 4.5 * wave

    water_depth = max(
        0,
        min(15, water_depth)
    )

    rise_rate = (
        0.45 * math.cos(elapsed / 15)
        + random.uniform(-0.03, 0.03)
    )

    discharge = (
        65000
        + 30000 * wave
        + random.uniform(-1000, 1000)
    )

    discharge = max(
        0,
        min(120000, discharge)
    )

    ssc = (
        1800
        + 450 * math.sin(elapsed / 15 + 0.5)
        + random.uniform(-20, 20)
    )

    ssc = max(
        1500,
        min(2500, ssc)
    )

    return {
        "water_depth": water_depth,
        "rise_rate": rise_rate,
        "discharge": discharge,
        "ssc": ssc
    }


def create_telemetry():

    global jam_detected
    global scour_active

    sensor = generate_sensor_data()

    depth = sensor["water_depth"]
    rise_rate = sensor["rise_rate"]
    discharge = sensor["discharge"]
    ssc = sensor["ssc"]

    density = calculate_slurry_density(ssc)

    pressure = calculate_hydrostatic_pressure(
        depth,
        density
    )

    sediment_transport = calculate_sediment_transport(
        discharge,
        ssc
    )

    efi = calculate_efi(
        depth,
        discharge,
        ssc,
        rise_rate
    )

    ttb = calculate_ttb(
        depth,
        rise_rate
    )

    status = get_alert_state(
        efi,
        depth
    )

    if manual_mode:

        gate = manual_gate

    else:

        gate = calculate_gate_control(
            efi,
            ttb
        )

    simulated_motor_current = 5

    if random.random() < 0.01:
        simulated_motor_current = 13.5

    if simulated_motor_current > 12:

        jam_detected = True
        scour_active = True

    else:

        jam_detected = False
        scour_active = False

    battery = 90 + random.uniform(-2, 2)

    hydro_power = 40

    autonomy = battery / 100 * 69.4

    return {

        "timestamp": time.time(),

        "discharge_cusecs": round(
            discharge,
            2
        ),

        "ssc_ppm": round(
            ssc,
            2
        ),

        "water_depth_m": round(
            depth,
            3
        ),

        "rate_of_rise_m_per_h": round(
            rise_rate,
            3
        ),

        "slurry_density_kg_m3": round(
            density,
            3
        ),

        "hydrostatic_pressure_kPa": round(
            pressure,
            3
        ),

        "sediment_transport_kg_s": round(
            sediment_transport,
            2
        ),

        "efi_score": round(
            efi,
            2
        ),

        "ttb_minutes": (
            None
            if ttb is None
            else round(ttb, 2)
        ),

        "system_status": status,

        "gate_1_position_pct": gate,

        "gate_2_position_pct": gate,

        "jam_detected": jam_detected,

        "scour_jets_active": scour_active,

        "manual_mode": manual_mode,

        "power_matrix": {

            "battery_soc_pct": round(
                battery,
                1
            ),

            "hydrokinetic_input_W": hydro_power,

            "offgrid_autonomy_hrs": round(
                autonomy,
                1
            )
        }
    }


@app.get("/")
def home():

    return {
        "system": "SILT-GUARD AI",
        "status": "ONLINE",
        "mode": "SOFTWARE SIMULATION"
    }


@app.get("/api/telemetry")
def get_telemetry():

    return create_telemetry()


@app.post("/api/gate/{position}")
def set_gate(position: int):

    global manual_mode
    global manual_gate

    if position < 0 or position > 100:
        return {
            "error": "Gate position must be 0-100"
        }

    manual_mode = True

    manual_gate = position

    return {
        "manual_mode": True,
        "gate_position": position
    }


@app.post("/api/auto")
def enable_auto():

    global manual_mode

    manual_mode = False

    return {
        "manual_mode": False,
        "message": "Automatic control enabled"
    }


@app.post("/api/test-jam")
def test_jam():

    global jam_detected
    global scour_active

    jam_detected = True

    scour_active = True

    return {
        "jam_detected": True,
        "scour_jets_active": True
    }


async def broadcast():

    while True:

        data = create_telemetry()

        disconnected = []

        for client in clients:

            try:

                await client.send_json(data)

            except:

                disconnected.append(client)

        for client in disconnected:

            clients.discard(client)

        await asyncio.sleep(0.2)


@app.on_event("startup")
async def startup():

    asyncio.create_task(
        broadcast()
    )


@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):

    await websocket.accept()

    clients.add(websocket)

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        clients.discard(websocket)

    except:

        clients.discard(websocket)