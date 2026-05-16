import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent {
  protected Math = Math;
  cartService = inject(CartService);
  private checkoutService = inject(CheckoutService);
  private router = inject(Router);

  loading = signal(false);

  updateQuantity(productoId: number, cantidad: number): void {
    this.cartService.updateQuantity(productoId, cantidad);
  }

  removeItem(productoId: number): void {
    this.cartService.removeItem(productoId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  async onCheckout(): Promise<void> {
    this.loading.set(true);
    try {
      const carrito = this.cartService.cartItems().map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio,
        cantidad: item.cantidad,
      }));

      this.checkoutService.enviarCarritoAlBackend(carrito).subscribe({
        next: (res: any) => {
          if (res.url) {
            window.location.href = res.url;
          } else {
            this.router.navigate(['/success']);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error en checkout:', err);
          alert('Error al procesar el pago. Intenta de nuevo.');
          this.loading.set(false);
        },
      });
    } catch (err) {
      console.error('Error en checkout:', err);
      alert('Error al procesar el pago. Intenta de nuevo.');
      this.loading.set(false);
    }
  }
}
