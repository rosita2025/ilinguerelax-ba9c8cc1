Objetivo: hacer que el producto “5,000 Spanish Words Digital” y el checkout nunca queden en blanco aunque falle/bloquee la detección de IP en USA/VPN o algún servicio externo.

Plan:
1. Blindar geolocalización
   - Crear un helper único para detectar país por IP con timeout, fallback por timezone y fallback final seguro a `US`.
   - Reemplazar llamadas duplicadas a `ipwho.is` por proveedores alternos reales y manejar bloqueos/rate limits sin romper la UI.
   - Hacer que `useRegionTier`, `useCampaignPrice` y `LanguageCurrencySelector` usen el mismo comportamiento tolerante a fallos.

2. Evitar pantalla blanca por errores de render
   - Añadir una barrera de error global alrededor de las rutas principales para mostrar una pantalla de recuperación en vez de blanco.
   - Si ocurre un error de chunk/import viejo, mantener el auto-reload existente.
   - Si ocurre un error normal de producto/checkout/geolocalización, mostrar un mensaje simple con botón “Recargar” y enlace a WhatsApp, sin tumbar toda la app.

3. Reforzar el producto Spanish 5,000 Digital
   - Asegurar que si la IP no se detecta o viene vacía, el producto cargue como Global/USA con precio global y botón interno de tienda.
   - Mantener Perú con PEN, LATAM Hotmart y USA/Canadá/Europa/Asia por tienda interna según la lógica actual.
   - Evitar que `pricingReady` bloquee para siempre si la base de datos tarda o falla: usar fallback del catálogo estático mientras llega el admin.

4. Reforzar checkout `/checkouts/5000-spanish-words`
   - Mantener el producto visible aunque la consulta del admin tarde/falle, usando el catálogo estático como respaldo.
   - Si geolocalización falla, cobrar/mostrar precio global USD en lugar de dejar estado incompleto.

5. Verificación
   - Probar localmente la ruta del producto y el checkout simulando:
     - USA/global
     - Perú
     - fallo total de `ipwho.is`
   - Confirmar que no aparece pantalla blanca y que siempre hay contenido o pantalla de recuperación.

Resultado esperado: con VPN en USA o desde Perú, la página no queda blanca; si se bloquea la detección IP, el sitio usa fallback seguro y sigue vendiendo.