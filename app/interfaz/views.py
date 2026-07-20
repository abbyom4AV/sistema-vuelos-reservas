from django.shortcuts import render


def login_view(request):
    return render(
        request,
        "interfaz/login.html",
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