# Automatizaciones PUBLICAS — Game Atlas Companion

Configuracion desde 2026-11-13:
- AUTOMATICO: .github/workflows/v210-free-scheduled-catalog.yml (noticias Rockstar, noticias independientes y fichas GTA Wiki; edicion de feeds JSON firmados).
- SOLO MANUAL: .github/workflows/v210-ci.yml (pruebas bajo demanda).
- SOLO MANUAL: .github/workflows/android-v215-build-apk-aab.yml (compilador Android historico V215; NO usar como build V220).
- Los otros 17 workflows historicos estan archivados AQUI, fuera de .github/workflows/, sin ejecucion automatica.
- GitHub Pages se actualiza cuando el repositorio publico recibe un nuevo feed firmado. El despliegue de Pages nativo no implica una nueva version de interfaz ni un deploy de Firebase.
- Una nueva version de web/Android/iOS se publica solo manualmente, desde su flujo aprobado. V220 reemplazara el workflow publico del recolector con el mismo calendario mas regeneracion de SEO firmado.
- NO agregar triggers push, pull_request, schedule o workflow_run a otros workflows sin evaluacion y permiso. Mantener el secreto CATALOG_SIGNING_KEY_PEM_BASE64 solo como Actions Secret, nunca escribirlo en archivos.
- La web principal Firebase https://gta6mapa.web.app/app/ permanece sin cambios por esta reorganizacion.
