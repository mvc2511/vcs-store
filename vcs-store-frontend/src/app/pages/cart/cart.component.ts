import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../shared/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environments';

interface CuponValidado {
  valido: boolean;
  descuento: number;
  cupon_id: number;
  codigo: string;
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  mensaje: string;
}

interface PrecioMayoreoItem {
  id: number;
  producto_id: number | null;
  categoria_id: number | null;
  cantidad_minima: number;
  precio_unitario: number;
}

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
  private http = inject(HttpClient);

  loading = signal(false);
  loadingCOD = signal(false);
  puntosEntrega = signal<{ id: number; nombre: string }[]>([]);
  selectedPunto = signal<number | null>(null);
  telefono = '';
  fechaEntrega = signal('');
  horaEntrega = signal('');

  readonly FRANJAS = ['Mañana (9:00 - 12:00)', 'Tarde (12:00 - 17:00)', 'Noche (17:00 - 20:00)'];

  // Coupon state
  cuponCode = signal('');
  cuponAplicado = signal<CuponValidado | null>(null);
  cuponLoading = signal(false);
  cuponError = signal('');

  // Wholesale state
  preciosMayoreo = signal<PrecioMayoreoItem[]>([]);

  subtotalConMayoreo = computed(() => {
    let total = 0;
    for (const item of this.cartService.cartItems()) {
      const wp = this.getWholesalePrice(item.producto.id, item.cantidad);
      const precio = wp ?? (item.producto.precio + (item.variante?.precio_adicional ?? 0));
      total += precio * item.cantidad;
    }
    return total;
  });

  descuentoTotal = computed(() => {
    const cupon = this.cuponAplicado();
    if (!cupon) return 0;
    if (cupon.tipo === 'fijo') return Math.min(cupon.valor, this.subtotalConMayoreo());
    return this.subtotalConMayoreo() * (cupon.valor / 100);
  });

  totalConDescuento = computed(() => {
    return Math.max(0, this.subtotalConMayoreo() - this.descuentoTotal());
  });

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
    this.cargarPreciosMayoreo();
  }

  private cargarPreciosMayoreo(): void {
    const items = this.cartService.cartItems();
    if (items.length === 0) return;
    const productIds = items.map(i => i.producto.id).filter(Boolean);
    if (productIds.length === 0) return;
    const params = productIds.map(id => `producto_ids=${id}`).join('&');
    this.http.get<PrecioMayoreoItem[]>(`${environment.apiUrl}/api/precios-mayoreo?${params}`).subscribe({
      next: (data) => this.preciosMayoreo.set(data),
      error: () => {},
    });
  }

  getItemPrice(item: { producto: { id: number; precio: number }; variante?: { precio_adicional?: number } | null; cantidad: number }): number {
    const basePrice = item.producto.precio + (item.variante?.precio_adicional ?? 0);
    const wp = this.getWholesalePrice(item.producto.id, item.cantidad);
    return wp ?? basePrice;
  }

  getWholesalePrice(productoId: number, cantidad: number): number | null {
    for (const wp of this.preciosMayoreo()) {
      if (wp.producto_id === productoId && cantidad >= wp.cantidad_minima) {
        return wp.precio_unitario;
      }
    }
    return null;
  }

  getBasePrice(item: { producto: { precio: number }; variante?: { precio_adicional?: number } | null }): number {
    return item.producto.precio + (item.variante?.precio_adicional ?? 0);
  }

  aplicarCupon(): void {
    const codigo = this.cuponCode().trim();
    if (!codigo) return;
    this.cuponLoading.set(true);
    this.cuponError.set('');
    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    const items = this.cartService.cartItems().map(item => ({
      producto_id: item.producto.id,
      categoria_id: item.producto.categoria_id ?? null,
      cantidad: item.cantidad,
    }));
    const total = this.cartService.totalPrice();
    this.http.post<CuponValidado>(`${environment.apiUrl}/api/cupones/validar`, { codigo, total, items }, { headers }).subscribe({
      next: (res) => {
        this.cuponAplicado.set(res);
        this.cuponLoading.set(false);
        this.cuponCode.set('');
      },
      error: (err) => {
        this.cuponLoading.set(false);
        this.cuponError.set(err.error?.detail || 'Cupón inválido o expirado');
      },
    });
  }

  quitarCupon(): void {
    this.cuponAplicado.set(null);
    this.cuponError.set('');
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
    const totalFinal = this.totalConDescuento();
    mensaje += `%0ATotal: $${totalFinal.toLocaleString()}`;
    if (this.cuponAplicado()) {
      mensaje += ` (cupón: ${this.cuponAplicado()!.codigo})`;
    }
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
      precio_unitario: this.getItemPrice(item),
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
