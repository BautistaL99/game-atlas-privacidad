# BORRADOR SIN FIRMAR — NO PUBLICAR COMO updates/catalog-envelope.json

Este archivo contiene novedades confirmadas por Rockstar para la revisión 1. No activar por copia directa. El cliente de Android y web exige una firma Ed25519 del payload usando la clave privada del catálogo, conservada fuera del repositorio público. La clave privada NUNCA se debe subir aquí ni compartir en el chat.

Pasos pendientes: revisar títulos/traducciones y confirmar que el resumen de cada noticia sea exacto; usar el procedimiento de firma existente (o workflow seguro de GitHub Actions) con la clave privada; generar el sobre JSON con payload base64 y signature; verificar con la clave pública de app/online-config.json; solo entonces reemplazar updates/catalog-envelope.json. Probar que el cliente carga revisión 1 y no elimina favoritos o progreso. No firmar ni publicar mientras falte la clave o el mecanismo seguro.

Estado: preparado, NO firmado, NO publicado al catálogo activo.
