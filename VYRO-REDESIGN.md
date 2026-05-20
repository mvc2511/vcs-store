# 🎯 VYRO — Strategy de Rediseño Visual

**Fecha:** 2026-05-19  
**Proyecto:** Transformación de VC'S Store → VYRO Modern Urban Boutique  
**Estado:** En Progreso

---

## 📌 Visión General

VYRO es una **tienda urbana minimalista** enfocada en streetwear + perfumería premium. La identidad visual comunica:
- **Curaduría estética** (no marketplace genérico)
- **Premium accesible** (lujo sin pretensión)
- **Modernidad urbana** (limpia, juvenil, editorial)

---

## 🎨 Sistema de Diseño VYRO

### Paleta de Colores

| Rol | Color | Hex | Uso |
|-----|-------|-----|-----|
| **Fondo** | Off-white | #F5F5F2 | Base de la aplicación |
| **Texto** | Negro carbón | #111111 | Títulos, body copy |
| **Neutro secundario** | Gris cemento | #D1D5DB | Elementos secundarios |
| **Neutro terciario** | Plata suave | #BFC3C9 | Bordes, dividers |
| **Acento** | Champagne suave | #C6A969 | CTAs, highlights |
| **Estado éxito** | Verde | #10B981 | Confirmaciones |
| **Estado error** | Rojo | #EF4444 | Errores, alertas |

**Principios:**
- Monocromático + single accent (champagne)
- Fondos neutrales (cemento, urbano)
- Sin gradientes vivos (sobrio)
- Alto contraste para legibilidad

---

### Tipografía

**Display/Headings:**
- **Space Grotesk** o **Satoshi** (variable)
- Bold, uppercase, tracking abierto
- Ej: "VYRO", "STREETWEAR COLLECTION", "SHOP"

**Body:**
- **Inter** (fallback sans-serif)
- Regular, limpio, espaciado generoso
- Ej: descripciones, copy, navegación

**Monospace (raro):**
- JetBrains Mono (para código/admin)

**Escala:**
- h1: 2.5rem (bold)
- h2: 2rem (bold)
- h3: 1.5rem (semibold)
- body: 1rem (regular)
- small: 0.875rem (regular)

---

### Espacios y Proporciones

- **Espacio negativo generoso** (no aglomerado)
- **Padding/margin uniforme:** xs (0.25) → 3xl (4rem)
- **Border radius:** 6px (inputs) → 16px (cards)
- **Grid:** 12 columnas con gutters 1.5rem

---

### Fotografía y Contenido

**Estética:**
- Fondos neutros (cemento, blanco puro)
- **Minimalismo urbano** (no caótico, no estudio hiperestilizado)
- Tonos **fríos y sobrios** (NO saturados)
- **Mucho aire alrededor** de sujeto principal
- Ropa: oversized, contemporáneo, drops limitados
- Perfumes: **close-ups premium**, iluminación lateral, superficies piedra/metal

**Ejemplos mentales:**
- Streetwear: modelo con oversized jacket sobre fondo gris, sombra mínima
- Perfume: botella en detalle sobre mármol blanco, lighting dramático pero sutil
- Lifestyle: outfit completo + fragancia, composición asimétrica, espacio blanco

---

## 🖥️ Rediseño de Componentes Clave

### 1. **Navbar**

**Actual:** Básico, comprimido, sin personalidad

**Nuevo:**
- **Logo VYRO:** Wordmark minimalista (VYRO en Space Grotesk, mayúsculas, tracking abierto)
- **Isotipo opcional:** V geométrica angular/minimalista (lado izquierdo)
- **Layout desktop:** Logo | Search bar (sutil) | Carrito + Avatar
- **Layout mobile:** Logo comprimido | Hamburger menu (animated)
- **Styling:** Fondo off-white, sin shadow (o sombra ultrasuave), border-bottom gris cemento 1px
- **Hover estados:** Texto → champagne, botones → subtle fade

**Comportamiento:**
- Search bar sticky en mobile con filtros sutiles (no dominante)
- Drawer hamburger con nav items limpios
- Avatar con dropdown (Mi Perfil, Logout)

---

### 2. **Home / Catálogo**

**Actual:** Grid simple, sin curatoría editorial

**Nuevo:**
- **Hero/Intro sección:** Frase corta editorial ("Urban Curation for Modern Lifestyle") sobre fondo cement, imagen hero minimalista (ropa oversized sobre gris)
- **Filter bar sticky:** Categorías como chips, ordenamiento (Precio ↑↓, Novedad), búsqueda inline — diseño limpio, no abrumador
- **Grid de productos:** 
  - Desktop: 4 columnas
  - Tablet: 3 columnas
  - Mobile: 2 columnas
  - Spacing: 2rem entre items
- **Product cards:** Imagen grande (sin padding innecesario), título + precio bajo — minimalista
- **Hover:** Overlay sutil (darkening 5%), "Ver detalle" o link implícito
- **Monocromático + accent:** Precios en champagne si on sale o highlight

---

### 3. **Product Detail**

**Actual:** Layout responsivo básico

**Nuevo:**
- **2 columnas desktop (1 mobile):**
  - **Columna izquierda:** Imagen hero grande (mucho espacio), galería vertical de thumbs (4-6 imágenes)
  - **Columna derecha:** 
    - Título (Space Grotesk, bold, 2rem)
    - Categoría (small caps, gris secundario)
    - Precio prominente (champagne, 1.5rem)
    - Descripción editorial (Inter, línea-height 1.6, max-width 40ch)
    - **Specs/Detalles:** Grid 2 col (Material, Tamaños disponibles, etc.)
    - **Stock indicator:** Visual sutil (barra, ej: "4 disponibles")
    - **CTA:** "AGREGAR AL CARRITO" (black btn, full-width mobile)
- **Perfume detail especial:**
  - Close-up de botella (fondo blanco o gris)
  - Notas olfativas (Pyramid structure: top/heart/base)
  - Recomendación de outfit combo (si existe)

---

### 4. **Product Card**

**Actual:** Card simple con imagen + info

**Nuevo:**
- **Estructura:**
  - Imagen (100% width, aspect-ratio: 3/4 o 1/1, object-fit: cover)
  - Padding 1rem entre imagen y texto
  - Título (Inter, 0.95rem, 2 líneas max)
  - Precio (champagne, 1.1rem, bold)
  - Categoría badge (gris light, tiny font)
- **Estados:**
  - **Hover desktop:** Overlay sutil + "View" text fade in
  - **Focus keyboard:** Ring champagne 2px
- **Responsive:** Escala bien en mobile (menor padding)

---

### 5. **Cart / Checkout**

**Actual:** Funcional pero visual sin carácter

**Nuevo:**
- **Cart page:**
  - Título "TU CARRITO" (Space Grotesk, uppercase)
  - Items en tabla simplificada o cards (mobile)
  - Cada item: imagen (pequeña), nombre, cantidad (input +/-), precio, botón delete (ícono X)
  - Subtotal / Shipping (gratis) / Total prominente (champagne)
  
- **Checkout methods:**
  - **Opción 1: WhatsApp** — Botón verde WhatsApp con icono, texto claro "Continuar por WhatsApp"
  - **Opción 2: Contra Entrega** — Botón negro "Confirmar Entrega"
  - Sección de **selección de punto de entrega** (dropdown limpio, mapa opcional)
  - Campo **teléfono** (input minimalist)
  - Selector **fecha + hora entrega** (date picker + dropdown hora)
  
- **Confirmación/Success:**
  - Página limpia post-COD
  - Número de orden (champagne)
  - Resumen compra (items + total + punto entrega)
  - Barra de progreso de orden (pendiente → confirmado → preparando → enviado → entregado)
  - Botón "Ir a Mis Pedidos" (track en tiempo real)

---

### 6. **Login / Signup**

**Actual:** Funcional, formularios basicos

**Nuevo:**
- **Diseño minimalista:**
  - Logo VYRO centered (pequeño, 2rem)
  - Título "INGRESA" / "CREA CUENTA" (Space Grotesk, 2rem, centered)
  - Inputs: placeholder limpio, border 1px gris, focus ring champagne
  - Botón: "ENTRAR" / "CREAR CUENTA" (black, full-width)
  - Divider "O CONTINÚA CON" (gris, centered)
  - Google OAuth button (minimalista, sin exceso de styling)
  
- **Signup extra:**
  - Nombre, Email, Password, Confirm Password
  - Checkbox Términos y Condiciones (pequeño, gris)
  - Password strength indicator (sutil, colores verde/amber/rojo)

- **Layout:** Centered card 400px max (mobile: full-width - 2rem padding)

---

### 7. **Mis Pedidos / Order History**

**Actual:** Tabla básica + cancelación

**Nuevo:**
- **Lista de órdenes:**
  - Cards (no tabla en mobile)
  - Orden # (champagne), fecha, total, estado
  - Badge estado (visual: pendiente=gris, confirmado=champagne, enviado=gris, entregado=green)
  - Expand icon para ver items y detalles
  
- **Detalle expandido:**
  - Items listados (imagen miniatura + nombre + cantidad)
  - Punto de entrega (dirección)
  - Fecha/hora entrega (si aplicable)
  - Barra de progreso horizontal (visual con steps)
  - Botón "Cancelar" (si pendiente, rojo light)

---

### 8. **Admin Panel**

**Actual:** Admin layout con sidebar funcional

**Nuevo:**
- **Sidebar:**
  - Logo VYRO pequeño (top)
  - Nav items: Productos, Categorías, Órdenes, Puntos Entrega
  - Styling: Fondo off-white, border-right gris 1px, items hover → champagne text
  - Mobile: Drawer con hamburger
  
- **Main content:**
  - Breadcrumb nav (Admin > Productos > Editar #123)
  - H1 título sección
  - Tables en desktop (responsive), cards en mobile
  
- **Producto cards (admin):**
  - Imagen + Nombre + Stock + Precio + Acciones (Edit, Delete)
  - Espacios limpios, hover → subtle BG change
  
- **Órdenes dashboard:**
  - Filtro por estado (dropdown)
  - Cards/expandibles con info orden
  - Cambio de estado (dropdown)
  - Edición de fecha/hora (inline edit con checkmark)

---

## 🎬 Animaciones y Transiciones

**Principio:** Subtle, purposeful, sin exceso.

- **Fade-in elements:** 0.3s ease-out, staggered delay (0ms, 50ms, 100ms)
- **Hover buttons:** Bg color shift 0.15s, texto bold (no transform)
- **Modal open:** Backdrop fade 0.2s, dialog slide up 0.25s
- **Skeleton loading:** Pulse animation (0.5s, opacity 0.5-1)
- **Success toast:** Slide in desde top 0.3s, auto-dismiss 4s

---

## 📱 Responsive Design

**Breakpoints:**
- **Mobile:** < 500px (stacked, full-width)
- **Tablet:** 500px - 767px (1-2 columnas)
- **Desktop:** 768px+ (3-4 columnas, sidebar)

**Cambios claves:**
- Grid de productos: 2 col (mobile) → 3 col (tablet) → 4 col (desktop)
- Navbar: Hamburger (mobile) → Full nav (tablet+)
- Formularios: Full-width (mobile) → 400px centered (desktop)
- Admin: Drawer (mobile) → Sidebar (desktop)

---

## 🔄 Implementación por Fases

### Fase 1: Design System (HIGH PRIORITY)
- [ ] Variables SCSS amplificadas (tipografía, spacing, nuevas utilidades)
- [ ] Import de CDN Space Grotesk (o Satoshi)
- [ ] Reset y normalize actualizado
- [ ] Utilidades de spacing/typography expandidas

### Fase 2: Componentes Base (HIGH PRIORITY)
- [ ] Navbar redesigned (logo VYRO, sticky search)
- [ ] Button system (primary/secondary/ghost variants)
- [ ] Input system (minimalist styling)
- [ ] Card component (reusable)
- [ ] Product card (new design)

### Fase 3: Páginas Públicas (HIGH PRIORITY)
- [ ] Home / Catálogo (hero + filter + grid)
- [ ] Product detail (2-column layout)
- [ ] Login / Signup (centered forms)
- [ ] Cart / Checkout (payment methods highlighted)

### Fase 4: Experiencia de Usuario (MEDIUM PRIORITY)
- [ ] Mis Pedidos (order history redesigned)
- [ ] Success page (enhanced tracking)
- [ ] Perfil (clean form)

### Fase 5: Admin (MEDIUM PRIORITY)
- [ ] Admin layout (sidebar/navbar refined)
- [ ] Admin productos (new card design)
- [ ] Admin órdenes (improved dashboard)
- [ ] Admin categorías/puntos (inline editing refined)

### Fase 6: Micro-interactions (LOW PRIORITY)
- [ ] Animations (subtle, purposeful)
- [ ] Transitions (smooth, 0.15-0.4s)
- [ ] Loading states (skeleton + pulse)
- [ ] Toast notifications (success/error)

---

## 📊 Checklist de Validación

- [ ] Paleta VYRO consistente en toda la app
- [ ] Tipografía Space Grotesk/Satoshi importada y aplicada
- [ ] Navbar con logo VYRO y búsqueda sticky
- [ ] Home con hero minimalista + filtros sutiles
- [ ] Product cards y detail con spacing generoso
- [ ] Cart con payment methods prominentes (WhatsApp + COD)
- [ ] Admin panel con sidebar y cards limpias
- [ ] Responsive probado en 320px, 767px, 1024px
- [ ] Animaciones sutiles (sin exceso)
- [ ] Contraste WCAG AA mínimo en textos

---

## 🎯 Resultado Final Esperado

Una **tienda moderna urbana** que transmite:
- ✅ Curaduría estética (no saturación)
- ✅ Premium pero accesible
- ✅ Limpia y minimalista
- ✅ Editorial y con carácter
- ✅ Mobile-first responsive
- ✅ Foco en fotografía y contenido de calidad

**Percepción:** "Una boutique urbana moderna con selección cuidada de streetwear y perfumería para un público joven."

