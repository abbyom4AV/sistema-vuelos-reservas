from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def respuesta_ok(message, data=None, status_code=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "message": message,
            "data": {} if data is None else data,
        },
        status=status_code,
    )


def respuesta_error(
    message,
    error_code,
    errors=None,
    status_code=status.HTTP_400_BAD_REQUEST,
):
    return Response(
        {
            "success": False,
            "message": message,
            "errorCode": error_code,
            "errors": errors or {},
        },
        status=status_code,
    )


def manejador_excepciones(exc, context):
    response = drf_exception_handler(exc, context)

    if response is None:
        return response

    status_code = response.status_code
    detalle = response.data

    if status_code == status.HTTP_400_BAD_REQUEST:
        error_code = "DATOS_INVALIDOS"
        message = "Los datos enviados no son válidos."
        if isinstance(detalle, dict):
            if "confirmar_password" in detalle:
                error_code = "CONFIRMACION_CONTRASENA_INVALIDA"
            elif "email" in detalle:
                error_code = "CORREO_DUPLICADO"
            elif "username" in detalle:
                error_code = "USUARIO_DUPLICADO"
    elif status_code == status.HTTP_401_UNAUTHORIZED:
        error_code = "TOKEN_AUSENTE"
        message = "Se requiere autenticación para realizar esta operación."
    elif status_code == status.HTTP_403_FORBIDDEN:
        error_code = "ROL_NO_AUTORIZADO"
        message = "No tiene permisos para realizar esta operación."
    elif status_code == status.HTTP_404_NOT_FOUND:
        error_code = "RECURSO_NO_ENCONTRADO"
        message = "El recurso solicitado no fue encontrado."
    else:
        error_code = "ACCION_NO_PERMITIDA"
        message = "No fue posible completar la operación."

    if isinstance(detalle, dict):
        mensaje_detalle = detalle.get("detail")
        if mensaje_detalle:
            message = str(mensaje_detalle)
        errors = {
            key: value
            for key, value in detalle.items()
            if key != "detail"
        }
    else:
        errors = {"detail": [str(detalle)]}

    response.data = {
        "success": False,
        "message": message,
        "errorCode": error_code,
        "errors": errors,
    }
    return response
