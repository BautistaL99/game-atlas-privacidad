GAME ATLAS COMPANION · V250 QA · 17/11/2026
BASE: V249. Entrega de fuentes para web PC/movil, Android e iOS.
NO es un lanzamiento final de tienda. NO contiene funciones de cobro activas ni publicidad operativa.

CORRECCION 1 / MAPA EN VIVO:
En el buscardor del mapa, las sugerencias y los pines cambian en cada entrada,
independientemente de dónde quede colocado el toolbar (Web escritorio, Web movil, Android, iOS).
Antes, el código abandonaba la actualización si toolbar no era hijo directo del mapa.
Ahora la actualización del escenario no depende de ello y preserva el input mientras se escribe.
Búsquedas genéricas en ES/EN/PT utilizan SOLO posiciones comunitarias existentes:
armas -> tiendas relacionadas (3) y vehiculos/autos -> servicios relacionados (18).
Nada se interpreta como posicion oficial ni aparición confirmada de armas/vehiculos.

CORRECCION 2 / IOS: 
Si se dibuja una ruta, el control 'Mostrar solo ruta' se coloca tambien en la barra
estable de busqueda de iPhone, fuera de la capa del canvas que podria ocultarlo.
Oculta pines no asociados pero mantiene ruta y sus paradas numeradas. Reversible.
Web y Android conservan su control anterior.

CAMBIO 3 / NOMBRE Y TIENDA:
En apps, botón corto 'Apoyar · Sin ads'. Pantalla con tres categorias de producto:
 A) quitar publicidad de por vida (pago único); sugerencias USD 10,20,50,100.
 B) sin anuncios con suscripción mensual; USD 1,2,3,5,10,20,50,100.
 C) aportes al Top (consumible de apoyo), USD 1,2,3,5,10,20,50,100.
La categoría C NO quita publicidad ni da acceso premium y sus montos se reflejarian
SOLO tras verificar el pago y consentimiento expreso del usuario.
Las categorias A y B no suman al ranking (separación solicitada).
Nunca se mostrará un ranking ficticio; reembolsos deben descontarse en el servidor.
No es beneficencia ni recaudación para ONGs; evitar la palabra 'donación benéfica'.

ESTADO COMERCIAL:
No hay checkout activo, compra restaurada, validación de recibos ni gestión de
suscripciones, servidores, alias/consentimiento o publicidad integrada.
Requiere registrar productos en App Store Connect y Google Play Console,
revisar aprobación de modelo de contribuciones por cada tienda, configurar
StoreKit 2 y Play Billing, validar en servidor, restaurar compras y refunds.
Los precios USD son referencia, no moneda/precio final impuesto al consumidor.
Politicas consultadas: developer.apple.com/app-store/review/guidelines/;
support.google.com/googleplay/android-developer/answer/10281818.

PRUEBAS REALIZADAS:
- Sintaxis JS con Node 22, pruebas V249 conservadas, nueva prueba V250 de
  actualización de pines sin toolbar hijo directo y de configuracion de tienda.
- NO se pudo ejecutar navegador gráfico completo con red en este entorno,
  NI ejecutar build iOS nativo. Verificar con QA manual en dispositivos.

PUBLICACION:
No sobrescribir /app de Firebase sin autorización. Usar web de prueba aislada.
Android: APK QA de paquete com.indie.viassistant.qa, no Play definitivo.
iOS: fuente nueva en rama GitHub separada, no TestFlight ni App Store automática.
