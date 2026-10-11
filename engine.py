RHO_WATER = 1000.0
G = 9.81
GS = 2.65


def clamp(value, minimum, maximum):
    return max(minimum, min(value, maximum))


def calculate_slurry_density(ssc_ppm):
    ssc = ssc_ppm / 1000.0

    return RHO_WATER + ssc * (1 - 1 / GS)


def calculate_hydrostatic_pressure(depth, density):
    return density * G * depth / 1000


def calculate_sediment_transport(discharge_cusecs, ssc_ppm):
    discharge_m3s = discharge_cusecs * 0.0283168
    ssc_kg_m3 = ssc_ppm / 1000.0

    return discharge_m3s * ssc_kg_m3


def calculate_efi(depth, discharge, ssc, rise_rate):

    stage_factor = clamp(depth / 12.0, 0, 1)

    discharge_factor = clamp(
        discharge / 100000.0,
        0,
        1
    )

    sediment_factor = clamp(
        (ssc - 1500.0) / 525.0,
        0,
        1
    )

    rise_factor = clamp(
        rise_rate / 1.0,
        0,
        1
    )

    efi = 100 * (
        0.40 * stage_factor +
        0.20 * discharge_factor +
        0.15 * sediment_factor +
        0.25 * rise_factor
    )

    if depth >= 12:
        efi = 100

    elif depth >= 10.5:
        efi = max(efi, 90)

    elif depth >= 9:
        efi = max(efi, 60)

    return clamp(efi, 0, 100)


def calculate_ttb(depth, rise_rate):

    if rise_rate <= 0.05:
        return None

    if depth >= 12:
        return None

    return ((12 - depth) / rise_rate) * 60


def get_alert_state(efi, depth):

    if efi >= 90 or depth >= 12:
        return "BREACH_RISK"

    if efi >= 80:
        return "CRITICAL"

    if efi >= 60:
        return "WARNING"

    if efi >= 30:
        return "WATCH"

    return "NORMAL"


def calculate_gate_position(efi):

    if efi < 30:
        return 0

    if efi < 60:
        return 25

    if efi < 80:
        return 50

    if efi < 90:
        return 75

    return 100


def calculate_gate_control(efi, ttb):

    gate = calculate_gate_position(efi)

    if ttb is not None and ttb < 30:
        gate = 100

    return gate