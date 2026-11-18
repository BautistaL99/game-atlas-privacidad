GAME ATLAS COMPANION — ANDROID V252 — CANDIDATA DE LANZAMIENTO
18/11/2026

Cambios V252: suscripción mensual primero, desde USD 0.99; precios .99; retirado el texto redundante sobre Top de las tarjetas sin anuncios. Se conserva el resto de V251. Compras y anuncios NO habilitados.

CÓDIGO: app/ y android-v215/www/ deben ser idénticas (QA automática). compile Gradle APK debug + AAB release desde el mismo stage; el workflow comprueba SHA-256 de TODOS los assets/public entre fuentes, APK y AAB, incluyendo imágenes, CSS, mapa, JS, manifest y recursos.

APK QA: com.indie.viassistant.qa. Se instala en paralelo y no sustituye la instalada por Google Play (com.indie.viassistant). La clave de desarrollo de GitHub se puede regenerar entre compilaciones: si Android no deja actualizar una versión QA anterior, exportar Mi partida y reinstalar. No borrar datos sin exportarlos.

AAB Google Play: com.indie.viassistant (versionCode 252; versionName 1.55.0). El workflow genera AAB DE RELEASE SIN FIRMA DE SUBIDA, no está lista para enviar a Play. Es imprescindible firmarla usando la MISMA clave de SUBIDA ya registrada en la cuenta Google Play; si no se dispone de ella, resolver con Play Console antes del lanzamiento. El APK de prueba y el AAB comparten exactamente el contenido web, pero llevan identidad y firma distintas. Para una instalación que actualice la app real desde Play, usar la pista de prueba de Play con su firma de distribución.

NO usar la rama main pública ni la carpeta /app de Firebase para cambiar la web: la web que se mantiene es V250. No activar productos de pago, suscripciones, anuncios ni ranking de cobros sin transacciones verificadas y cumplimiento de Google Play. Completar además ficha, política de privacidad y revisiones de consola antes de publicación pública.
