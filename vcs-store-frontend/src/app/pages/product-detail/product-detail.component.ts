import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SupabaseService } from '../../shared/services/supabase.service';
import { CartService } from '../../shared/services/cart.service';
import { WishlistService } from '../../shared/services/wishlist.service';
import { SeoService } from '../../core/services/seo.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environments';
import { Producto, ProductoImagen, Resena, Variante } from '../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  protected Math = Math;
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private seo = inject(SeoService);
  private http = inject(HttpClient);
  protected authService = inject(AuthService);
  private toast = inject(ToastService);
  private readonly WHATSAPP_NUMBER = environment.whatsappNumber;

  readonly esEncargo = computed(() => !!this.producto()?.es_encargo);

  readonly whatsappLink = computed(() => {
    const p = this.producto();
    if (!p) return '';
    const encargoText = this.esEncargo()
      ? `Hola, quiero pedir este perfume por encargo: ${p.nombre} ($${p.precio}) - https://vyro.boutique/producto/${p.id}`
      : `Hola, me interesa este producto: ${p.nombre} (ID: ${p.id}) - https://vyro.boutique/producto/${p.id}`;
    return `https://wa.me/${this.WHATSAPP_NUMBER}?text=${encodeURIComponent(encargoText)}`;
  });

  producto = signal<Producto | null>(null);
  cantidad = signal(1);
  loading = true;

  selectedTalla = signal<string | null>(null);
  selectedColor = signal<string | null>(null);

  uniqueTallas = computed(() => {
    const p = this.producto();
    if (!p?.variantes?.length) return [];
    const tallas = new Set(p.variantes.map(v => v.nombre_variante).filter((t): t is string => t != null));
    return Array.from(tallas);
  });

  uniqueColores = computed(() => {
    const p = this.producto();
    if (!p?.variantes?.length) return [];
    const colores = new Set(p.variantes.map(v => v.color).filter((c): c is string => c != null));
    return Array.from(colores);
  });

  hasVariants = computed(() => !!this.producto()?.variantes?.length);
  hasTalla = computed(() => this.uniqueTallas().length > 0);
  hasColor = computed(() => this.uniqueColores().length > 0);

  variantTypeLabel = computed(() => {
    const p = this.producto();
    const tipo = p?.variantes?.[0]?.tipo_variante;
    if (tipo === 'volumen') return { spec: 'VOLUMEN', selector: 'ml' };
    if (tipo === 'talla') return { spec: 'TALLAS', selector: 'Talla' };
    if (tipo === 'color_solo') return { spec: 'COLOR', selector: 'Color' };
    return { spec: 'TALLAS', selector: 'Talla' };
  });
  noVariantSelected = computed(() => !this.selectedTalla() && !this.selectedColor());

  tallaStock = computed(() => {
    const p = this.producto();
    const color = this.selectedColor();
    const map = new Map<string, number>();
    for (const v of p?.variantes ?? []) {
      if (v.nombre_variante && (!color || v.color === color)) {
        const current = map.get(v.nombre_variante) ?? 0;
        map.set(v.nombre_variante, current + v.stock);
      }
    }
    return map;
  });

  colorStock = computed(() => {
    const p = this.producto();
    const talla = this.selectedTalla();
    const map = new Map<string, number>();
    for (const v of p?.variantes ?? []) {
      if (v.color && (!talla || v.nombre_variante === talla)) {
        const current = map.get(v.color) ?? 0;
        map.set(v.color, current + v.stock);
      }
    }
    return map;
  });

  selectedVariant = computed(() => {
    const p = this.producto();
    if (!p?.variantes?.length) return null;
    const talla = this.selectedTalla();
    const color = this.selectedColor();
    if (this.hasTalla() && this.hasColor()) {
      return p.variantes.find(v => v.nombre_variante === talla && v.color === color) ?? null;
    }
    if (this.hasTalla()) {
      return p.variantes.find(v => v.nombre_variante === talla) ?? null;
    }
    if (this.hasColor()) {
      return p.variantes.find(v => v.color === color) ?? null;
    }
    return null;
  });

  precioActual = computed(() => {
    const p = this.producto();
    if (!p) return 0;
    const v = this.selectedVariant();
    if (v) return v.precio ?? p.precio;
    if (p.has_variants) return 0;
    return p.precio;
  });

  stockActual = computed(() => {
    const p = this.producto();
    const v = this.selectedVariant();
    if (v) return v.stock;
    if (p?.has_variants) return p.stock_real ?? 0;
    return p?.stock ?? 0;
  });

  showWhatsApp = computed(() => {
    const p = this.producto();
    if (!p) return false;
    if (p.has_variants) return (p.stock_real ?? 0) === 0;
    return p.stock === 0;
  });

  canAddToCart = computed(() => {
    if (this.hasVariants() && !this.selectedVariant()) {
      return false;
    }
    return this.stockActual() > 0;
  });

  stockText = computed(() => {
    const stock = this.stockActual();
    if (this.hasVariants() && !this.selectedVariant()) {
      if (this.noVariantSelected() && stock === 0) return 'Agotado';
      if (this.noVariantSelected()) return 'Selecciona una variante';
      return 'Selecciona una variante';
    }
    if (stock === 0) return 'Agotado';
    if (stock <= 5) return `Últimas ${stock} unidades`;
    return 'En stock';
  });

  stockClass = computed(() => {
    if (this.stockActual() === 0) return 'out-of-stock';
    if (this.stockActual() <= 5) return 'low-stock';
    return '';
  });

  stockBarPercent = computed(() => {
    const stock = this.stockActual();
    const max = 20;
    return Math.min(100, (stock / max) * 100);
  });

  stockBarClass = computed(() => {
    if (this.stockActual() <= 3) return 'critical';
    if (this.stockActual() <= 5) return 'low';
    return '';
  });

  // ── Gallery ────────────────────────────
  selectedImageIndex = signal(0);

  galleryImages = computed((): ProductoImagen[] => {
    const p = this.producto();
    if (!p) return [];

    const selectedColor = this.selectedColor();

    // No color selected → show all (main + gallery)
    if (!selectedColor) {
      const merged: ProductoImagen[] = [];
      if (p.imagen_url) {
        merged.push({ id: -1, producto_id: p.id, url: p.imagen_url, orden: -1, color_id: null, creado_en: '' });
      }
      const galleryImgs = p.imagenes ?? [];
      merged.push(...galleryImgs);
      return merged;
    }

    // Color selected → show only images tagged with that color
    const colorImages = (p.imagenes ?? []).filter(i => {
      if (i.color_id == null) return false;
      const color = p.variantes?.find(v => v.color_id === i.color_id);
      return color?.color === selectedColor;
    });

    if (colorImages.length > 0) return colorImages;

    // Fallback: no images tagged for this color → show general images
    return (p.imagenes ?? []).filter(i => i.color_id == null);
  });

  selectedImageUrl = computed(() => {
    const g = this.galleryImages();
    const idx = this.selectedImageIndex();
    if (g.length > 0 && idx < g.length) return g[idx].url;
    return this.producto()?.imagen_url ?? '';
  });

  isFavorited = computed(() =>
    this.wishlistService.wishlistIds().has(this.producto()?.id ?? 0)
  );

  toggleWishlist(): void {
    const id = this.producto()?.id;
    if (id) this.wishlistService.toggle(id);
  }

  resenas = signal<Resena[]>([]);
  miResena = signal<Resena | null>(null);
  haComprado = signal(false);

  newPuntuacion = signal(0);
  newComentario = signal('');
  newAnonima = signal(false);

  editPuntuacion = signal(0);
  editComentario = signal('');
  editAnonima = signal(false);

  hoverPuntuacion = signal(0);

  promedio = computed(() => {
    const r = this.resenas();
    if (!r.length) return 0;
    return r.reduce((s, r) => s + r.puntuacion, 0) / r.length;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.supabase.getProductById(id).subscribe({
        next: (data) => {
          this.producto.set(data);
          this.loading = false;
          if (data) {
            this.updateSeo(data);
            this.cargarResenas();
            this.cargarMiResena();
            this.verificarCompra();
          }
        },
        error: () => { this.loading = false; },
      });
    }
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  selectTalla(talla: string): void {
    this.selectedTalla.update((prev) => prev === talla ? null : talla);
  }

  selectColor(color: string): void {
    this.selectedColor.update((prev) => prev === color ? null : color);
    this.selectedImageIndex.set(0);
  }

  isTallaAvailable(talla: string): boolean {
    return (this.tallaStock().get(talla) ?? 0) > 0;
  }

  isColorAvailable(color: string): boolean {
    return (this.colorStock().get(color) ?? 0) > 0;
  }

  private updateSeo(p: Producto): void {
    const url = `https://vyro.boutique/producto/${p.id}`;
    this.seo.update({
      title: p.nombre,
      description: p.descripcion?.slice(0, 160) || `${p.nombre} en VYRO`,
      ogTitle: p.nombre,
      ogDescription: p.descripcion?.slice(0, 160) || `${p.nombre} - Moda urbana en VYRO`,
      ogImage: this.selectedImageUrl() || p.imagen_url || undefined,
      ogUrl: url,
      canonicalUrl: url,
    });

    this.seo.setProductJsonLd({
      name: p.nombre,
      description: p.descripcion || '',
      image: p.imagen_url || '',
      price: this.precioActual(),
      availability: p.es_encargo ? false : this.stockActual() > 0,
      sku: p.id,
    });

    this.seo.setBreadcrumbJsonLd([
      { name: 'Inicio', url: 'https://vyro.boutique/' },
      { name: p.categoria || 'Productos', url: `https://vyro.boutique/#${p.categoria}` },
      { name: p.nombre, url },
    ]);
  }

  addToCart(): void {
    const p = this.producto();
    if (p) {
      this.cartService.addItem(p, this.cantidad(), this.selectedVariant());
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  cargarResenas(): void {
    const id = this.producto()?.id;
    if (!id) return;
    this.http.get<Resena[]>(`${environment.apiUrl}/api/productos/${id}/resenas`).subscribe({
      next: (data) => this.resenas.set(data),
    });
  }

  cargarMiResena(): void {
    const id = this.producto()?.id;
    if (!id || !this.authService.isLoggedIn()) return;
    this.http.get<Resena | null>(`${environment.apiUrl}/api/productos/${id}/resenas/mi-resena`, {
      headers: this.getHeaders(),
    }).subscribe({
      next: (data) => {
        this.miResena.set(data);
        if (data) {
          this.editPuntuacion.set(data.puntuacion);
          this.editComentario.set(data.comentario || '');
          this.editAnonima.set(data.anonima);
        }
      },
    });
  }

  verificarCompra(): void {
    const id = this.producto()?.id;
    if (!id || !this.authService.isLoggedIn()) return;
    this.http.get<{ can_review: boolean; ya_reseno: boolean; ha_comprado: boolean }>(
      `${environment.apiUrl}/api/productos/${id}/can-review`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => this.haComprado.set(data.ha_comprado),
    });
  }

  enviarResena(): void {
    const id = this.producto()?.id;
    if (!id || this.newPuntuacion() < 1) {
      this.toast.warning('Selecciona una puntuación');
      return;
    }
    this.http.post<Resena>(
      `${environment.apiUrl}/api/productos/${id}/resenas`,
      {
        puntuacion: this.newPuntuacion(),
        comentario: this.newComentario() || null,
        anonima: this.newAnonima(),
      },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        this.toast.success('Reseña publicada');
        this.miResena.set(data);
        this.editPuntuacion.set(data.puntuacion);
        this.editComentario.set(data.comentario || '');
        this.editAnonima.set(data.anonima);
        this.newPuntuacion.set(0);
        this.newComentario.set('');
        this.newAnonima.set(false);
        this.cargarResenas();
      },
      error: (err) => {
        if (err.status === 403) {
          this.haComprado.set(false);
          this.toast.error('Debes adquirir este producto para reseñarlo');
        } else if (err.status === 400) {
          this.toast.error(err.error?.detail || 'Ya has reseñado este producto');
        } else {
          this.toast.error('Error al publicar la reseña');
        }
      },
    });
  }

  editarResena(): void {
    const r = this.miResena();
    if (!r) return;
    this.http.put<Resena>(
      `${environment.apiUrl}/api/resenas/${r.id}`,
      {
        puntuacion: this.editPuntuacion() || r.puntuacion,
        comentario: this.editComentario() || null,
        anonima: this.editAnonima(),
      },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        this.toast.success('Reseña actualizada');
        this.miResena.set(data);
        this.editPuntuacion.set(data.puntuacion);
        this.editComentario.set(data.comentario || '');
        this.editAnonima.set(data.anonima);
        this.cargarResenas();
      },
      error: () => this.toast.error('Error al actualizar la reseña'),
    });
  }

  eliminarResena(): void {
    const r = this.miResena();
    if (!r) return;
    if (!confirm('¿Eliminar tu reseña?')) return;
    this.http.delete(`${environment.apiUrl}/api/resenas/${r.id}`, {
      headers: this.getHeaders(),
    }).subscribe({
      next: () => {
        this.toast.success('Reseña eliminada');
        this.miResena.set(null);
        this.editPuntuacion.set(0);
        this.editComentario.set('');
        this.editAnonima.set(false);
        this.newPuntuacion.set(0);
        this.newComentario.set('');
        this.newAnonima.set(false);
        this.cargarResenas();
      },
      error: () => this.toast.error('Error al eliminar la reseña'),
    });
  }
}
