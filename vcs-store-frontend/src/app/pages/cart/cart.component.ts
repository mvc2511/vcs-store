import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environments';

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
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  loadingCOD = signal(false);

  private readonly WHATSAPP_NUMBER = environment.whatsappNumber;

  updateQuantity(productoId: number, cantidad: number): void {
    this.cartService.updateQuantity(productoId, cantidad);
  }

  removeItem(productoId: number): void {
    this.cartService.removeItem(productoId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  onWhatsApp(): void {
    const items = this.cartService.cartItems();
    let mensaje = 'Hola, quiero hacer un pedido:%0A';
    items.forEach((item) => {
      mensaje += `- ${item.producto.nombre} x${item.cantidad} - $${(
        item.producto.precio * item.cantidad
      ).toLocaleString()}%0A`;
    });
    mensaje += `%0ATotal: $${this.cartService.totalPrice().toLocaleString()}`;
    window.open(
      `https://wa.me/${this.WHATSAPP_NUMBER}?text=${mensaje}`,
      '_blank'
    );
  }

  onCOD(): void {
    this.loadingCOD.set(true);
    const items = this.cartService.cartItems().map((item) => ({
      producto_id: item.producto.id,
      cantidad: item.cantidad,
    }));

    this.checkoutService.crearOrdenCOD(items).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.loadingCOD.set(false);
        this.router.navigate(['/success'], { queryParams: { tipo: 'cod' } });
      },
      error: (err) => {
        console.error('Error en COD:', err);
        alert('Error al crear la orden. Intenta de nuevo.');
        this.loadingCOD.set(false);
      },
    });
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
