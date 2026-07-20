from .api_responses import respuesta_ok


class EnvelopeReadOnlyViewSetMixin:
    """Envuelve respuestas de consulta sin habilitar mutaciones."""

    mensajes = {
        "list": "Consulta realizada correctamente.",
        "retrieve": "Recurso consultado correctamente.",
    }

    def _envolver(self, action, response):
        return respuesta_ok(
            self.mensajes[action],
            response.data,
            status_code=response.status_code,
        )

    def list(self, request, *args, **kwargs):
        return self._envolver(
            "list",
            super().list(request, *args, **kwargs),
        )

    def retrieve(self, request, *args, **kwargs):
        return self._envolver(
            "retrieve",
            super().retrieve(request, *args, **kwargs),
        )


class EnvelopeModelViewSetMixin(EnvelopeReadOnlyViewSetMixin):
    """Extiende las respuestas envelope a operaciones CRUD."""

    mensajes = {
        **EnvelopeReadOnlyViewSetMixin.mensajes,
        "create": "Recurso creado correctamente.",
        "update": "Recurso actualizado correctamente.",
        "partial_update": "Recurso actualizado correctamente.",
    }

    def create(self, request, *args, **kwargs):
        return self._envolver(
            "create",
            super().create(request, *args, **kwargs),
        )

    def update(self, request, *args, **kwargs):
        return self._envolver(
            "update",
            super().update(request, *args, **kwargs),
        )

    def partial_update(self, request, *args, **kwargs):
        return self._envolver(
            "partial_update",
            super().partial_update(request, *args, **kwargs),
        )
