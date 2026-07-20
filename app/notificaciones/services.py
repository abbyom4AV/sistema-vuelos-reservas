from .models import Notificacion


def crear_notificacion(
    *,
    usuario,
    tipo,
    titulo,
    mensaje,
):
    return Notificacion.objects.create(
        usuario=usuario,
        tipo=tipo,
        titulo=titulo,
        mensaje=mensaje,
    )