# app/interfaz/views.py

from django.shortcuts import render


def login_view(request):
    return render(
        request,
        "interfaz/login.html",
    )


def registro_view(request):
    return render(
        request,
        "interfaz/registro.html",
    )


def verificar_otp_view(request):
    return render(
        request,
        "interfaz/verificar_otp.html",
    )


def panel_view(request):
    return render(
        request,
        "interfaz/panel.html",
    )


def buscar_vuelos_view(request):
    return render(
        request,
        "interfaz/buscar_vuelos.html",
    )


def mis_reservas_view(request):
    return render(
        request,
        "interfaz/mis_reservas.html",
    )


def usuarios_view(request):
    return render(
        request,
        "interfaz/usuarios.html",
    )


def acceso_denegado_view(request):
    return render(
        request,
        "interfaz/acceso_denegado.html",
    )


def notificaciones_view(request):
    return render(
        request,
        "interfaz/notificaciones.html",
    )


def bitacora_view(request):
    return render(
        request,
        "interfaz/bitacora.html",
    )


def cambiar_contrasena_view(request):
    return render(
        request,
        "interfaz/cambiar_contrasena.html",
    )

def aeronaves_view(request):
    return render(
        request,
        "interfaz/aeronaves.html",
    )


def rutas_view(request):
    return render(
        request,
        "interfaz/rutas.html",
    )


def vuelos_view(request):
    return render(
        request,
        "interfaz/vuelos.html",
    )


def reservas_view(request):
    return render(
        request,
        "interfaz/reservas.html",
    )

def pago_view(request):
    return render(
        request,
        "interfaz/pago.html",
    )

def reportes_view(request):
    return render(
        request,
        "interfaz/reportes.html",
    )

def asientos_view(request):
    return render(
        request,
        "interfaz/asientos.html",
    )

