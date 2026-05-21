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
  styleUrl: './cart.component.scss',
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

  getItemPrice(item: { producto: { precio: number }; variante?: { precio_adicional?: number } | null }): number {
    return item.producto.precio + (item.variante?.precio_adicional ?? 0);
  }

  updateQuantity(productoId: number, cantidad: number, varianteId?: number | null): void {
    this.cartService.updateQuantity(productoId, cantidad, varianteId);
  }

  removeItem(productoId: number, varianteId?: number | null): void {
    this.cartService.removeItem(productoId, varianteId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  getStockWarning(item: { producto: { id: number }; variante?: { id?: number } | null }): { reason: string; available: number } | null {
    const key = `${item.producto.id}:${item.variante?.id ?? 'base'}`;
    for (const w of this.cartService.stockWarnings()) {
      if (w.key === key) return { reason: w.reason, available: w.available };
    }
    return null;
  }

  getVarianteText(item: { variante?: { nombre_variante?: string | null; color?: string | null } | null }): string {
    const v = item.variante;
    if (!v) return '';
    const partes: string[] = [];
    if (v.nombre_variante) partes.push(v.nombre_variante);
    if (v.color) partes.push(v.color);
    return partes.length ? ' — ' + partes.join(' / ') : '';
  }

  onWhatsApp(): void {
    const items = this.cartService.cartItems();
    let mensaje = 'Hola, quiero hacer un pedido:%0A';
    items.forEach((item) => {
      const precio = this.getItemPrice(item);
      const variantxt = this.getVarianteText(item);
      mensaje += `- ${item.producto.nombre}${variantxt} x${item.cantidad} - $${(
        precio * item.cantidad
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
      variante_id: item.variante?.id ?? null,
    }));

    this.checkoutService
      .crearOrdenCOD(items, this.selectedPunto()!, this.telefono.trim(), this.fechaEntrega() || undefined, this.horaEntrega() || undefined)
      .subscribe({
        next: (res) => {
          this.cartService.clearCart();
          this.loadingCOD.set(false);
          sessionStorage.setItem('ultimaOrden', JSON.stringify(res));
          this.router.navigate(['/success'], {
            queryParams: {
              tipo: 'cod',
              orden: res.id,
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
        precio: this.getItemPrice(item),
        cantidad: item.cantidad,
        variante_id: item.variante?.id ?? null,
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
