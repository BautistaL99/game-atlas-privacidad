GAME ATLAS — COPIAS DE CÓDIGO DE LANZAMIENTO (PRUEBA V247)
17 de noviembre de 2026

Esta rama es QA: NO modifica la web pública ni la publicación de Google Play.
El paquete iOS toma el commit 3ecef61e2a3ed08fb84b99f28621028b4b4bed63 del repositorio público game-atlas-ios-build-free, rama qa-ios-v246.

TRES ARCHIVOS DE RESPALDO
1. GAME-ATLAS-WEB-PC-MOVIL-V247-FUENTES.zip
   Contiene el directorio app/ completo (HTML, CSS, JS, iconos, mapa, fuentes y manifest). Se usa para la web de PC y móvil. No sobrescribe ni publica el sitio hasta hacerlo voluntariamente.
2. GAME-ATLAS-ANDROID-V247-FUENTES.zip
   Contiene app/ y android-v215/ (configuración Capacitor 8, plantilla Android, herramientas de construcción) y el workflow del APK/AAB. No contiene un APK firmado ni AAB de producción. El código nativo se genera con npm install y npx cap add android.
3. GAME-ATLAS-IOS-V246-FUENTES.zip
   Contiene ios-v220/ completo y las instrucciones y workflows para reconstrucción con macOS/Xcode/GitHub Actions. No contiene IPA ni claves de firma de Apple. Los secretos Apple están en GitHub Settings y no se incluyen en respaldos públicos.

SEGURIDAD Y CONTINUIDAD
- Conserva las claves de almacenamiento y la importación local de Mi partida, sin borrar progreso, favoritos, rutas o marcadores guardados.
- Nunca desinstalar una versión instalada ni borrar datos locales sin exportar una copia de Mi partida.
- Para publicar Android, confirmar antes que versionCode=247 supere el número actualmente publicado en Google Play; la AAB de release requiere firma de subida válida.
- Para iOS, usar el workflow en el repositorio iOS; no publicar IPA, certificados ni secretos en el ZIP.
- Los contenidos dinámicos se consultan de un catálogo remoto Ed25519 firmado. Que el consumidor funcione no demuestra que los productores de noticias/fichas se hayan actualizado; hay que verificar los feeds por separado.
- El mapa comunitario incluye atribución de GTADB; no atribuir precisión oficial a coordenadas ilustrativas.

IDIOMA
Primera apertura: usa orden de idiomas preferidos del navegador o dispositivo. ES->español, EN->inglés, PT->portugués; otro idioma->inglés. Se prioriza siempre una elección manual guardada en vi_demo_locale. No se usa geolocalización.

PUBLICACIÓN WEB
Usar como origen el directorio app/. Validar primero PC, web móvil y responsive. No reemplazar la web pública desde esta rama sin aprobación.

PUBLICACIÓN ANDROID
Desde la raíz del ZIP: node android-v215/prepare-android.mjs stage
Luego cd android-v215 && npm install && npx cap add android && npx cap sync android
Volver a raíz y ejecutar node android-v215/prepare-android.mjs native
Compilar con Gradle y firma según Play Console. Consultar workflow .github/workflows/android-v215-build-apk-aab.yml del repositorio.

PRUEBAS: node qa/v247-public-client.mjs y cuatro scripts qa/v247-qa-*.mjs en raíz. Requiere Node.js 22.

IMPORTANTE: Los tests automáticos verifican la fuente y la lógica. Falta QA manual en navegadores, Android real y orientación/teclado de diversos tamaños.


DOCUMENTACION AMPLIADA — EDICION V247 (17/11/2026)
--------------------------------------------------
Leer primero: manuales-v247/LEER_PRIMERO_INDICE_V247.txt
Explicación profunda, común a las tres apps: manuales-v247/MANUAL_COMPARTIDO_FUNCIONAMIENTO_V247.txt
Manual WEB: manuales-v247/MANUAL_WEB_PC_MOVIL_V247.txt
Manual ANDROID: manuales-v247/MANUAL_ANDROID_V247.txt
Manual IOS: manuales-v247/MANUAL_IOS_V246.txt
También se conserva CHECKLIST_PRUEBAS_V247.txt.

Los paquetes ahora INCLUYEN manual completo e índice, NO solo este resumen; el paquete iOS además conserva los TXT anteriores V241, V242, V243, V244, V245 y V246 como historial de las correcciones. Si esos documentos muestran una rama antigua, prevalece el manual V247/V246 y el código de SHA congelado.
Los manuales explican recursos, reconstrucción, idiomas, buscadores, mapas, rutas, noticias y Wiki Ed25519, copias de Mi partida, QA, errores, publicación y recuperación, separando lo hecho de lo pendiente.
Estas guías son documentación: NO firman apps, NO actualizan clientes instalados y NO publican el sitio público por su existencia.
