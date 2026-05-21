import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { CartService } from '../../shared/services/cart.service';
import { SeoService } from '../../core/services/seo.service';
import { Producto, Variante } from '../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  protected Math = Math;
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private cartService = inject(CartService);
  private seo = inject(SeoService);

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
    if (v) return p.precio + v.precio_adicional;
    return p.precio;
  });

  stockActual = computed(() => {
    const v = this.selectedVariant();
    if (v) return v.stock;
    return this.producto()?.stock ?? 0;
  });

  canAddToCart = computed(() => {
    if (this.hasVariants() && !this.selectedVariant()) {
      return false;
    }
    return this.stockActual() > 0;
  });

  stockText = computed(() => {
    const stock = this.stockActual();
    if (this.hasVariants() && !this.selectedVariant() && !this.noVariantSelected()) {
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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.supabase.getProductById(id).subscribe({
        next: (data) => {
          this.producto.set(data);
          this.loading = false;
          if (data) this.updateSeo(data);
        },
        error: () => { this.loading = false; },
      });
    }
  }

  selectTalla(talla: string): void {
    this.selectedTalla.update((prev) => prev === talla ? null : talla);
  }

  selectColor(color: string): void {
    this.selectedColor.update((prev) => prev === color ? null : color);
  }

  isTallaAvailable(talla: string): boolean {
    return (this.tallaStock().get(talla) ?? 0) > 0;
  }

  isColorAvailable(color: string): boolean {
    return (this.colorStock().get(color) ?? 0) > 0;
  }

  private updateSeo(p: Producto): void {
    const url = `https://vcsstore.com/producto/${p.id}`;
    this.seo.update({
      title: p.nombre,
      description: p.descripcion?.slice(0, 160) || `${p.nombre} en VC'S Store`,
      ogTitle: p.nombre,
      ogDescription: p.descripcion?.slice(0, 160) || `${p.nombre} - Moda urbana en VC'S Store`,
      ogImage: p.imagen_url || undefined,
      ogUrl: url,
      canonicalUrl: url,
    });

    this.seo.setProductJsonLd({
      name: p.nombre,
      description: p.descripcion || '',
      image: p.imagen_url || '',
      price: this.precioActual(),
      availability: this.stockActual() > 0,
      sku: p.id,
    });

    this.seo.setBreadcrumbJsonLd([
      { name: 'Inicio', url: 'https://vcsstore.com/' },
      { name: p.categoria || 'Productos', url: `https://vcsstore.com/#${p.categoria}` },
      { name: p.nombre, url },
    ]);
  }

  addToCart(): void {
    const p = this.producto();
    if (p) {
      this.cartService.addItem(p, this.cantidad(), this.selectedVariant());
    }
  }
}
