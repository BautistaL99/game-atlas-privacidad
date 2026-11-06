# Game Atlas web V159 — noticias e imágenes

Fecha: 2026-11-06.

La portada de la aplicación /app/ no cambia. Las noticias oficiales recientes se consultan en /app/#/noticias/oficiales y las antiguas en /app/#/noticias/archivo. El archivo se activa automáticamente cuando una noticia queda fuera de las 12 últimas y supera 90 días de antigüedad. El historial se preserva: no se borra la ficha, la fecha, las imágenes enlazadas ni las fuentes Rockstar.

Las noticias oficiales SEO cuentan ahora con una lista histórica /guia-gta-6/noticias/archivo/ marcada noindex,follow (no aparece en el sitemap). Las páginas propias de cada comunicado permanecen publicadas e incluidas en el sitemap y conservan enlaces a Rockstar.

El actualizador firmado conserva las imágenes referenciadas en el catálogo activo. Solamente purga archivos verificados de su propia caché vi-verified-images-v143 si llevan más de 90 días sin estar referenciados, y limita a 24 los huérfanos recientes. No borra fotos remotas de Rockstar ni la caché HTTP gestionada por el navegador. Las blob URLs de imágenes verificadas reemplazadas se liberan al aplicar la actualización.

El caché de la PWA es game-atlas-safe-v159. La app Android de Google Play no se actualiza por esta publicación web.

Fuente canónica privada: shared/site/ y scripts/generate-static-seo.mjs. Pruebas de regresión en .github/workflows/test-news-archive-v159.yml. Recuperación detallada en docs/AUTOMATIZACION_NOTICIAS_ARCHIVO_IMAGENES_V159.md y el manual TXT del repositorio privado.

Plan de trabajo: 1 SEO completado inicialmente; 2 archivo de noticias e imágenes (actual); 3 wikis, armas/vehículos/localizaciones; 4 Android; 5 iOS.
