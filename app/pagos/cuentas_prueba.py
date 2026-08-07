"""
Cuentas de prueba para simular el pago.
Saldo fijo: no se descuenta con el uso,
solo determina si esa cuenta puede cubrir
el monto de la reserva.
"""

CUENTAS_TARJETA = {
    "4827 1934": 400,
    "5612 8845": 50,
}

CUENTAS_PAYPAL = {
    "p400@flytrack.test": 400,
    "p50@flytrack.test": 50,
}


def obtener_saldo(metodo, cuenta):
    if metodo == "TARJETA":
        return CUENTAS_TARJETA.get(cuenta)
    if metodo == "PAYPAL":
        return CUENTAS_PAYPAL.get(cuenta)
    return None