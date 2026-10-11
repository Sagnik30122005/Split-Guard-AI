import React, {
    useEffect,
    useState
} from "react";

import {
    createRoot
} from "react-dom/client";

import "./style.css";


const initialData = {

    discharge_cusecs: 0,

    ssc_ppm: 0,

    water_depth_m: 0,

    rate_of_rise_m_per_h: 0,

    slurry_density_kg_m3: 0,

    hydrostatic_pressure_kPa: 0,

    sediment_transport_kg_s: 0,

    efi_score: 0,

    ttb_minutes: null,

    system_status: "NORMAL",

    gate_1_position_pct: 0,

    gate_2_position_pct: 0,

    jam_detected: false,

    scour_jets_active: false,

    manual_mode: false,

    power_matrix: {

        battery_soc_pct: 0,

        hydrokinetic_input_W: 0,

        offgrid_autonomy_hrs: 0
    }
};


function MetricCard({
    title,
    value,
    unit,
    max
}) {

    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (Number(value) / max) * 100
            )
        );


    return (

        <div className="metric-card">

            <div className="metric-title">

                {title}

            </div>


            <div className="metric-value">

                {Number(value).toFixed(1)}

                <span>
                    {unit}
                </span>

            </div>


            <div className="progress">

                <div
                    className="progress-fill"
                    style={{
                        width:
                            `${percentage}%`
                    }}
                />

            </div>

        </div>
    );
}


function StatusBadge({
    status
}) {

    return (

        <div
            className={
                `status-badge ${status.toLowerCase()}`
            }
        >

            {status}

        </div>
    );
}


function App() {

    const [data, setData] =
        useState(initialData);


    const [connected, setConnected] =
        useState(false);


    useEffect(() => {

        let socket;


        function connect() {

            socket =
                new WebSocket(
                    "ws://127.0.0.1:8000/ws/telemetry"
                );


            socket.onopen = () => {

                setConnected(true);

            };


            socket.onmessage = event => {

                const newData =
                    JSON.parse(
                        event.data
                    );

                setData(newData);

            };


            socket.onclose = () => {

                setConnected(false);

            };


            socket.onerror = () => {

                setConnected(false);

            };

        }


        connect();


        return () => {

            if (socket) {

                socket.close();

            }

        };

    }, []);


    async function setManualGate(
        position
    ) {

        await fetch(
            `http://127.0.0.1:8000/api/gate/${position}`,
            {
                method: "POST"
            }
        );

    }


    async function enableAutomatic() {

        await fetch(
            "http://127.0.0.1:8000/api/auto",
            {
                method: "POST"
            }
        );

    }


    async function testJam() {

        await fetch(
            "http://127.0.0.1:8000/api/test-jam",
            {
                method: "POST"
            }
        );

    }


    const status =
        data.system_status;


    return (

        <div className="app">


            <header className="header">

                <div>

                    <h1>
                        SILT-GUARD AI
                    </h1>

                    <p>
                        Hybrid Hydro-Silt
                        Management & Digital Twin
                    </p>

                </div>


                <div
                    className={
                        connected
                            ? "connection online"
                            : "connection offline"
                    }
                >

                    {connected
                        ? "● LIVE • 5 Hz"
                        : "● OFFLINE"}

                </div>

            </header>


            <section
                className={
                    `alert ${status.toLowerCase()}`
                }
            >

                <div>

                    <small>
                        SYSTEM STATUS
                    </small>

                    <h2>
                        {status}
                    </h2>

                </div>


                <div>

                    <small>
                        EFI SCORE
                    </small>

                    <h2>
                        {data.efi_score.toFixed(1)}
                        /100
                    </h2>

                </div>


                <div>

                    <small>
                        TIME TO BREACH
                    </small>

                    <h2>

                        {
                            data.ttb_minutes === null
                                ? "N/A"
                                :
                                `${data.ttb_minutes.toFixed(1)} min`
                        }

                    </h2>

                </div>

            </section>


            <div className="section-title">

                LIVE HYDROLOGICAL TELEMETRY

            </div>


            <section className="metrics">


                <MetricCard
                    title="Discharge"
                    value={
                        data.discharge_cusecs
                    }
                    unit="cusecs"
                    max={100000}
                />


                <MetricCard
                    title="Suspended Sediment"
                    value={
                        data.ssc_ppm
                    }
                    unit="ppm"
                    max={2500}
                />


                <MetricCard
                    title="Water Stage"
                    value={
                        data.water_depth_m
                    }
                    unit="m"
                    max={15}
                />


                <MetricCard
                    title="Rate of Rise"
                    value={
                        Math.max(
                            0,
                            data.rate_of_rise_m_per_h
                        )
                    }
                    unit="m/h"
                    max={1}
                />


                <MetricCard
                    title="EFI"
                    value={
                        data.efi_score
                    }
                    unit=""
                    max={100}
                />


                <MetricCard
                    title="Gate 1"
                    value={
                        data.gate_1_position_pct
                    }
                    unit="%"
                    max={100}
                />


                <MetricCard
                    title="Gate 2"
                    value={
                        data.gate_2_position_pct
                    }
                    unit="%"
                    max={100}
                />


                <MetricCard
                    title="Battery"
                    value={
                        data.power_matrix
                            .battery_soc_pct
                    }
                    unit="%"
                    max={100}
                />

            </section>


            <div className="section-title">

                DIGITAL TWIN ANALYTICS

            </div>


            <section className="analytics">


                <div className="panel">

                    <h3>
                        HYDRODYNAMIC PHYSICS
                    </h3>


                    <div className="row">

                        <span>
                            Slurry Density
                        </span>

                        <strong>
                            {
                                data.slurry_density_kg_m3
                                    .toFixed(3)
                            }
                            {" "}kg/m³
                        </strong>

                    </div>


                    <div className="row">

                        <span>
                            Hydrostatic Pressure
                        </span>

                        <strong>
                            {
                                data.hydrostatic_pressure_kPa
                                    .toFixed(3)
                            }
                            {" "}kPa
                        </strong>

                    </div>


                    <div className="row">

                        <span>
                            Sediment Transport
                        </span>

                        <strong>
                            {
                                data.sediment_transport_kg_s
                                    .toFixed(2)
                            }
                            {" "}kg/s
                        </strong>

                    </div>


                    <div className="row">

                        <span>
                            Hydrokinetic Input
                        </span>

                        <strong>
                            {
                                data.power_matrix
                                    .hydrokinetic_input_W
                            }
                            {" "}W
                        </strong>

                    </div>

                </div>


                <div className="panel">

                    <h3>
                        SAFETY SYSTEM
                    </h3>


                    <div className="safety-item">

                        <span>
                            Gate Status
                        </span>

                        <StatusBadge
                            status={
                                `${data.gate_1_position_pct}% OPEN`
                            }
                        />

                    </div>


                    <div className="safety-item">

                        <span>
                            Jam Detection
                        </span>

                        <span
                            className={
                                data.jam_detected
                                    ? "danger"
                                    : "safe"
                            }
                        >

                            {
                                data.jam_detected
                                    ? "JAM DETECTED"
                                    : "NO JAM"
                            }

                        </span>

                    </div>


                    <div className="safety-item">

                        <span>
                            Scour Jets
                        </span>

                        <span
                            className={
                                data.scour_jets_active
                                    ? "warning-text"
                                    : "safe"
                            }
                        >

                            {
                                data.scour_jets_active
                                    ? "ACTIVE"
                                    : "OFF"
                            }

                        </span>

                    </div>


                    <div className="safety-item">

                        <span>
                            Control Mode
                        </span>

                        <span>

                            {
                                data.manual_mode
                                    ? "MANUAL"
                                    : "AUTOMATIC"
                            }

                        </span>

                    </div>

                </div>


                <div className="panel">

                    <h3>
                        POWER SYSTEM
                    </h3>


                    <div className="battery">

                        <div
                            className="battery-level"
                            style={{
                                width:
                                    `${data.power_matrix.battery_soc_pct}%`
                            }}
                        />

                    </div>


                    <h2>

                        {
                            data.power_matrix
                                .battery_soc_pct
                                .toFixed(1)
                        }%

                    </h2>


                    <p>
                        Estimated autonomy:
                        {" "}
                        {
                            data.power_matrix
                                .offgrid_autonomy_hrs
                                .toFixed(1)
                        }
                        {" "}hours
                    </p>

                </div>

            </section>


            <div className="section-title">

                CONTROL CENTER

            </div>


            <section className="control-panel">

                <div>

                    <h3>
                        Manual Gate Override
                    </h3>

                    <p>
                        Manual commands override
                        automatic control.
                    </p>

                </div>


                <div className="buttons">

                    <button
                        onClick={() =>
                            setManualGate(0)
                        }
                    >
                        0%
                    </button>


                    <button
                        onClick={() =>
                            setManualGate(25)
                        }
                    >
                        25%
                    </button>


                    <button
                        onClick={() =>
                            setManualGate(50)
                        }
                    >
                        50%
                    </button>


                    <button
                        onClick={() =>
                            setManualGate(75)
                        }
                    >
                        75%
                    </button>


                    <button
                        onClick={() =>
                            setManualGate(100)
                        }
                    >
                        100%
                    </button>


                    <button
                        className="auto-button"
                        onClick={
                            enableAutomatic
                        }
                    >
                        AUTO
                    </button>


                    <button
                        className="jam-button"
                        onClick={testJam}
                    >
                        TEST JAM
                    </button>

                </div>

            </section>


            <footer>

                SILT-GUARD AI • Local Digital Twin
                • Software Simulation Mode

            </footer>

        </div>
    );
}


createRoot(
    document.getElementById("root")
).render(
    <App />
);