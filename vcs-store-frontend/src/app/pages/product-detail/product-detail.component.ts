import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { CartService } from '../../shared/services/cart.service';
import { SeoService } from '../../core/services/seo.service';
import { Producto } from '../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, CurrencyPipe, RouterLink],
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
      price: p.precio,
      availability: p.stock > 0,
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
      this.cartService.addItem(p, this.cantidad());
    }
  }
}
