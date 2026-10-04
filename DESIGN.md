# Forwarder — sistema visual

## Dirección

**Manifiesto de carga.** La interfaz se lee como un buen documento de embarque: datos ordenados, jerarquía clara, cero decoración. Es una herramienta que se usa ocho horas al día, así que manda la calma y la densidad legible, no el efecto.

- Los códigos (COT-2026-0004, L-2026-0003, BL) se muestran en monoespaciada: son identificadores, se copian y se dictan por teléfono.
- Las cifras siempre en tabulares y alineadas a la derecha.
- Separar con líneas finas y espacio, no con tarjetas dentro de tarjetas.
- Un solo color de acento (naranja de contenedor) para lo accionable y el foco. Los estados usan su propio color, siempre con texto.

Referencias tomadas como inspiración (no como identidad): la sobriedad tabular de Stripe Dashboard y el uso de un único acento cálido de herramientas industriales.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `paper` | `#F5F3EE` | Fondo general (papel cálido) |
| `surface` | `#FFFFFF` | Zonas de contenido y tablas |
| `ink` | `#15191F` | Texto principal |
| `ink-2` | `#4B5361` | Texto secundario (7:1 sobre `paper`) |
| `ink-3` | `#6B7280` | Etiquetas y metadatos (4.6:1 sobre `surface`) |
| `rule` | `#E3DFD6` | Líneas y bordes |
| `navy` | `#0E2A45` | Barra lateral, encabezados fuertes |
| `signal` | `#C2410C` | Acento: acciones principales y anillo de foco |
| `ok` | `#1E7A4C` | Cumplido / aceptado |
| `warn` | `#9A5B00` | Pendiente de cliente / borrador enviado |
| `bad` | `#B42318` | Rechazado / canal rojo |
| `info` | `#1F5FA8` | En curso |

Los estados se pintan como fondo al 10% del color con el texto en el color pleno.

## Tipografía

- **IBM Plex Sans** (400, 500, 600) para todo el texto. Carácter técnico, buena lectura en tamaños chicos.
- **IBM Plex Mono** (400, 500) para códigos, números de documento y montos destacados.
- Escala: 12 · 13 · 14 (base) · 16 · 20 · 28. Altura de línea 1.45 en texto y 1.2 en títulos.
- Números con `font-variant-numeric: tabular-nums`.

## Espaciado, radios, sombras

- Escala de 4 px. Separación entre secciones: 32 px en escritorio y 24 px en móvil. Margen lateral de 16 px en móvil.
- Radios: 6 px en controles y 10 px en paneles. Nada redondeado en exceso.
- Sombras: ninguna en reposo; solo los menús flotantes llevan una sombra suave. La profundidad se marca con bordes.

## Movimiento

- Transiciones de 150 ms `cubic-bezier(0.2, 0, 0, 1)` solo en color, fondo y opacidad (hover, foco, presionado).
- Botón presionado: `scale(0.98)`.
- Con `prefers-reduced-motion` se desactivan las transformaciones.

## Responsive

Mobile first. En móvil la navegación va en una barra superior con menú y las tablas pasan a filas apiladas. Desde 1024 px aparece la barra lateral fija.
