import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../shared/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {
  protected Math = Math;
  cartService = inject(CartService);
  private checkoutService = inject(CheckoutService);
  authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  loadingCOD = signal(false);
  puntosEntrega = signal<{ id: number; nombre: string }[]>([]);
  selectedPunto = signal<number | null>(null);
  telefono = '';
  fechaEntrega = signal('');
  horaEntrega = signal('');

  readonly FRANJAS = ['Mañana (9:00 - 12:00)', 'Tarde (12:00 - 17:00)', 'Noche (17:00 - 20:00)'];

  tomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  private readonly WHATSAPP_NUMBER = environment.whatsappNumber;

  ngOnInit(): void {
    this.checkoutService.getPuntosEntrega().subscribe({
      next: (data) => this.puntosEntrega.set(data),
    });
  }

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
    if (!this.selectedPunto() || !this.telefono.trim()) return;
    this.loadingCOD.set(true);
    const items = this.cartService.cartItems().map((item) => ({
      producto_id: item.producto.id,
      cantidad: item.cantidad,
    }));

    this.checkoutService
      .crearOrdenCOD(items, this.selectedPunto()!, this.telefono.trim(), this.fechaEntrega() || undefined, this.horaEntrega() || undefined)
      .subscribe({
        next: (res) => {
          this.cartService.clearCart();
          this.loadingCOD.set(false);
          this.router.navigate(['/success'], {
            queryParams: {
              tipo: 'cod',
              punto: this.selectedPunto(),
              telefono: this.telefono.trim(),
            },
          });
        },
        error: (err) => {
          console.error('Error en COD:', err);
          const msg =
            err.error?.detail || 'Error al crear la orden. Intenta de nuevo.';
          alert(msg);
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
