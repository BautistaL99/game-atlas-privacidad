# Publicación y SEO — Game Atlas Companion

## Enlaces
- Aplicación (URL canónica): https://bautistal99.github.io/game-atlas-privacidad/app/
- Política de privacidad: https://bautistal99.github.io/game-atlas-privacidad/
- Repositorio: https://github.com/BautistaL99/game-atlas-privacidad
- Sitemap: https://bautistal99.github.io/game-atlas-privacidad/sitemap.xml
- Search Console: https://search.google.com/search-console/

## Alojamiento y actualizaciones
Sitio publicado mediante GitHub Pages desde este repositorio. Antes de modificar archivos, verificar la configuración concreta de Pages en Settings > Pages y el flujo de actualizaciones en Actions. No modificar la actualización del catálogo firmado ni los archivos de la aplicación Android para cambios de SEO.

## Alta en Google
1. Abrir Search Console con la cuenta propietaria y agregar la propiedad tipo 'Prefijo de URL': https://bautistal99.github.io/game-atlas-privacidad/ (si la verificación elegida lo admite).
2. Verificar la propiedad mediante el método que indique Google.
3. En Sitemaps enviar: https://bautistal99.github.io/game-atlas-privacidad/sitemap.xml
4. Inspeccionar https://bautistal99.github.io/game-atlas-privacidad/app/ y solicitar indexación si corresponde.
5. Verificar estado de indexación y búsquedas con los informes de Search Console (no existe garantía de posicionamiento).

## Dominio propio (pendiente de elección y compra)
Elegir un dominio disponible y registrarlo con el propietario. En GitHub Settings > Pages configurar 'Custom domain' y configurar DNS en el registrador según la documentación vigente de GitHub Pages. Activar HTTPS después de validar DNS. Cuando el dominio funcione, cambiar canonical, OG URLs, sitemap, Search Console y enlaces publicados al nuevo dominio. Evitar establecer DNS incorrecto para prevenir secuestro de subdominios.

## Precauciones
- No publicar claves ni archivos de firma del catálogo.
- Conservar el aviso de no afiliación a Rockstar Games.
- Los enlaces con ?v=... y #/ no deben promocionarse como URL pública canónica.
- Un robots.txt dentro del subdirectorio del proyecto de GitHub Pages NO controla el rastreo del host github.io; se necesitaría control del raíz del dominio para ello.
- Probar Android y web después de fusionar cualquier cambio: esta rama sólo modifica metadatos de la web y añade archivos de SEO/documentación.
