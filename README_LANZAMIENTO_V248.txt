LEER PRIMERO — GAME ATLAS V248: 3 COPIAS DE CÓDIGO + APK DE PRUEBA
17/11/2026 · Estado QA, NO producción
====================================================

Este paquete documental acompaña tres ZIP independientes:
1) GAME-ATLAS-WEB-PC-MOVIL-V248-FUENTES.zip
   Cliente web para PC/móvil. La vista V248 de pruebas está en
   https://bautistal99.github.io/game-atlas-privacidad/revision-v248-prueba-web-android-20261117/
   NO sustituye la web pública https://gta6mapa.web.app/app/.
2) GAME-ATLAS-ANDROID-V248-FUENTES.zip
   Incluye app/, android-v215/ (nombre histórico) y scripts de generación/QA. El
   APK instalable separado se construye en Actions y su release Android V248-R2.
   Es una app DE PRUEBA, no firmada como subida oficial de Google Play.
3) GAME-ATLAS-IOS-V248-FUENTES.zip
   Incluye el proyecto ios-v220/ (nombre histórico), su workflow Apple y
   LEER_PRIMERO_IOS_V248.txt. CÓDIGO solamente: no IPA ni secretos Apple.

ORDEN DE LECTURA
A) manuales-v248/LEER_PRIMERO_CAMBIOS_Y_PRUEBAS_V248.txt: los errores detectados,
   los archivos corregidos, su comportamiento esperado y cómo reproducirlos.
B) manuales-v247/MANUAL_COMPARTIDO_FUNCIONAMIENTO_V247.txt: datos, mapa, noticias,
   wikis firmadas Ed25519, idioma, favoritos, rutas y Mi partida.
C) manuales-v247/MANUAL_WEB_PC_MOVIL_V247.txt, MANUAL_ANDROID_V247.txt o
   MANUAL_IOS_V246.txt según la plataforma; son manuales profundos de base.
D) CHECKLIST_PRUEBAS_V247.txt y QA/v248-map-regressions.mjs.
   Los nombres V247 en algunos manuales indican BASE HISTÓRICA, NO versión de código.
E) Para iOS, LEER_PRIMERO_IOS_V248.txt y TXT anteriores V241-V246 para historia.

DATOS Y PRIVACIDAD
Los datos personales viven en localStorage de cada instalación/origen. Apagar/
reiniciar el celular normalmente los conserva, pero desinstalar, borrar datos
o cambiar el identificador de la app puede hacerlos inaccesibles. Exportar desde
Mi partida antes de cambios destructivos; conservar JSON fuera de GitHub.

CALIDAD Y LIMITACIONES
La validación de fuente no reemplaza QA visual en dispositivos. No anunciar
ubicaciones de aparición de autos/armas sin datos verificables. En el mapa
comunitario actual se reconocen 3 puntos de tiendas de armas y 18 lugares
relacionados con vehículos por nombre/tags: son negocios/servicios, no spawns
confirmados por Rockstar. No se tocó la automatización de noticias/fichas.

RECONSTRUCCIÓN
WEB: servir carpeta app/ desde HTTP local o seguir flujo de publicación
revisado con Firebase/GitHub. NO hacer deploy automático de esta QA.
ANDROID: node android-v215/prepare-android.mjs stage
         cd android-v215 && npm install && npx cap add android && npx cap sync android
         cd .. && node android-v215/prepare-android.mjs native
         después Gradle y firma controlada; APK de QA usa com.indie.viassistant.qa.
IOS: macOS/Xcode/Capacitor 8 o GitHub Actions en qa-ios-v248-map-fixes,
     con claves Apple ya autorizadas, sin pegarlas en scripts públicos.

NOTAS
Los archivos ZIP de esta serie no son APK, AAB firmado ni IPA.
La web pública, Google Play y App Store NO cambian por crear este respaldo.
La copia solo es válida junto con su etiqueta de release y SHA256SUMS.txt.
