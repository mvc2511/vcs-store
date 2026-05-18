import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../shared/services/supabase.service';
import { CartService } from '../../shared/services/cart.service';
import { Producto } from '../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [NgIf, CurrencyPipe, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  protected Math = Math;
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);
  private cartService = inject(CartService);

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
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  addToCart(): void {
    const p = this.producto();
    if (p) {
      this.cartService.addItem(p, this.cantidad());
    }
  }
}
