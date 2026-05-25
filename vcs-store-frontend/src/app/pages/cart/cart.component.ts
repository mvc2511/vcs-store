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

  loadingCOD = signal(false);
  puntosEntrega = signal<{ id: number; nombre: string }[]>([]);
  horariosEntrega = signal<{ id: number; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>([]);
  selectedPunto = signal<number | null>(null);
  telefono = '';
  fechaEntrega = signal('');
  horaEntrega = signal('');

  private readonly DIAS: Record<number, string> = { 6: 'Sábado', 7: 'Domingo' };

  formatHorario(h: { dia_semana: number; hora_inicio: string; hora_fin: string }): string {
    const dia = this.DIAS[h.dia_semana] || '';
    const inicio = h.hora_inicio.slice(0, 5);
    const fin = h.hora_fin.slice(0, 5);
    return `${dia} ${inicio} - ${fin}`;
  }

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
      const precio = wp ?? (item.variante?.precio ?? item.producto.precio);
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

  minWeekend(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 6 ? 1 : day === 0 ? 6 : 6 - day;
    const d = new Date(today);
    d.setDate(d.getDate() + diff);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  onFechaChange(): void {
    const val = this.fechaEntrega();
    if (!val) return;
    const d = new Date(val + 'T12:00:00');
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      this.fechaEntrega.set('');
    }
  }

  private readonly WHATSAPP_NUMBER = environment.whatsappNumber;

  ngOnInit(): void {
    this.checkoutService.getPuntosEntrega().subscribe({
      next: (data) => this.puntosEntrega.set(data),
    });
    this.http.get<{ id: number; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>(`${environment.apiUrl}/api/horarios-entrega`).subscribe({
      next: (data) => this.horariosEntrega.set(data.filter(h => h.activo)),
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

  getItemPrice(item: { producto: { id: number; precio: number }; variante?: { precio?: number | null } | null; cantidad: number }): number {
    const basePrice = item.variante?.precio ?? item.producto.precio;
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

  getBasePrice(item: { producto: { precio: number }; variante?: { precio?: number | null } | null }): number {
    return item.variante?.precio ?? item.producto.precio;
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
}
