import { Component, input, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, NgIf } from '@angular/common';
import { Producto } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, NgIf],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  producto = input.required<Producto>();
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly isLoggedIn = this.authService.isLoggedIn;

  readonly isFavorited = computed(() =>
    this.wishlistService.wishlistIds().has(this.producto().id)
  );

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.wishlistService.toggle(this.producto().id);
  }

  addToCart(): void {
    const prod = this.producto();
    
    // If product has variants, redirect to detail page instead of quick-add
    if (prod.has_variants) {
      this.router.navigate(['/producto', prod.id]);
      return;
    }
    
    this.cartService.addItem(prod);
  }
}
