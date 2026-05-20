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
    const tallas = new Set(
      p.variantes.map(v => v.talla).filter((t): t is string => t != null)
    );
    return Array.from(tallas);
  });

  uniqueColores = computed(() => {
    const p = this.producto();
    if (!p?.variantes?.length) return [];
    const colores = new Set(
      p.variantes.map(v => v.color).filter((c): c is string => c != null)
    );
    return Array.from(colores);
  });

  hasVariants = computed(() => {
    const p = this.producto();
    return !!p?.variantes?.length;
  });

  hasTalla = computed(() => this.uniqueTallas().length > 0);
  hasColor = computed(() => this.uniqueColores().length > 0);
  noVariantSelected = computed(() => !this.selectedTalla() && !this.selectedColor());

  selectedVariant = computed(() => {
    const p = this.producto();
    if (!p?.variantes?.length) return null;
    const talla = this.selectedTalla();
    const color = this.selectedColor();
    if (this.hasTalla() && this.hasColor()) {
      return p.variantes.find(v => v.talla === talla && v.color === color) ?? null;
    }
    if (this.hasTalla()) {
      return p.variantes.find(v => v.talla === talla) ?? null;
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
      return this.producto()?.stock ? this.producto()!.stock > 0 : false;
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
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  selectTalla(talla: string): void {
    this.selectedTalla.update((prev) => prev === talla ? null : talla);
  }

  selectColor(color: string): void {
    this.selectedColor.update((prev) => prev === color ? null : color);
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
