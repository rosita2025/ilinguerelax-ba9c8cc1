# Plan de Ajuste de Diseño del Hero para Desktop

Se optimizará el diseño del carrusel en la sección Hero para pantallas de escritorio (Desktop), asegurando que el contenido se vea limpio y sin espacios laterales vacíos, manteniendo la adaptabilidad en móviles y tablets.

## Cambios Técnicos

### Frontend: UI & Estilos
- **Refactorización del Contenedor (`Hero.tsx`)**:
  - Ajustar el ancho máximo del contenedor del carrusel en pantallas grandes (`lg:`, `xl:`) a un valor más contenido (por ejemplo, `lg:max-w-4xl`) para evitar el estiramiento horizontal excesivo.
  - Asegurar que el fondo del slide coincida con la imagen para eliminar las franjas grises laterales.
- **Optimización de Imágenes**:
  - Aplicar `lg:object-cover` o ajustar el escalado en desktop para que la imagen llene el contenedor visible sin dejar espacios muertos.
  - Mantener `object-contain` en móviles/tablets para preservar la integridad de la imagen del producto según sea necesario.
- **Ajuste de Navegación**:
  - Reposicionar las flechas de Swiper (`prev`/`next`) para que floten exactamente en los bordes de la imagen en desktop.

## Detalles Técnicos
- Uso de breakpoints de Tailwind: `lg:max-w-4xl`, `lg:mx-auto`.
- Ajuste de clases en `img`: `lg:w-full`, `lg:h-full`, `lg:object-cover`.
- Modificación de los estilos inyectados para las flechas de navegación para asegurar su posición relativa a la imagen en pantallas anchas.

## Verificación
- Previsualizar en modo Desktop (1280px+) para confirmar la eliminación de franjas laterales.
- Verificar en modo Tablet e iPad para asegurar que el diseño previo se mantiene intacto.
- Validar en Mobile para confirmar que la imagen sigue ocupando el ancho completo correctamente.
