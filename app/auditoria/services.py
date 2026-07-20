from .models import Bitacora


def obtener_direccion_ip(request):
    if request is None:
        return None

    encabezado_ip = request.META.get("HTTP_X_FORWARDED_FOR")

    if encabezado_ip:
        return encabezado_ip.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR")


def registrar_evento(
    *,
    request=None,
    usuario=None,
    accion,
    entidad="",
    entidad_id="",
    resultado=Bitacora.Resultado.EXITO,
    detalle="",
):
    metodo_http = ""
    endpoint = ""

    if request is not None:
        metodo_http = request.method
        endpoint = request.path

    return Bitacora.objects.create(
        usuario=usuario,
        accion=accion,
        entidad=entidad,
        entidad_id=str(entidad_id) if entidad_id else "",
        resultado=resultado,
        detalle=detalle,
        metodo_http=metodo_http,
        endpoint=endpoint,
        direccion_ip=obtener_direccion_ip(request),
    )