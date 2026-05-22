import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Producto, CarritoItem, Variante } from '../models/product.model';
import { CheckoutService } from '../../core/services/checkout.service';
import { AuthService } from '../../core/services/auth.service';

interface CartDBItem {
  id: number;
  producto_id: number;
  variante_id: number | null;
  cantidad: number;
  productos?: {
    id: number;
    nombre: string;
    precio: number;
    imagen_url: string;
    stock: number;
  };
  variantes_producto?: {
    id: number;
    nombre_variante: string | null;
    tipo_variante: string | null;
    color: string | null;
    stock: number;
    precio_adicional: number;
    imagen_url: string | null;
  } | null;
}

function cartKey(productoId: number, varianteId?: number | null): string {
  return `${productoId}:${varianteId ?? 'base'}`;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private checkoutService = inject(CheckoutService);
  private authService = inject(AuthService);

  private cartItemsSignal = signal<CarritoItem[]>([]);
  private dbIdMap = new Map<string, number>();

  readonly cartItems = this.cartItemsSignal.asReadonly();

  readonly stockWarnings = computed(() => {
    const issues: Array<{ key: string; item: CarritoItem; reason: 'out_of_stock' | 'insufficient_stock'; available: number }> = [];
    for (const item of this.cartItemsSignal()) {
      const stock = item.variante?.stock ?? item.producto.stock;
      if (stock <= 0) {
        issues.push({ key: cartKey(item.producto.id, item.variante?.id), item, reason: 'out_of_stock', available: 0 });
      } else if (stock < item.cantidad) {
        issues.push({ key: cartKey(item.producto.id, item.variante?.id), item, reason: 'insufficient_stock', available: stock });
      }
    }
    return issues;
  });

  readonly hasStockIssues = computed(() => this.stockWarnings().length > 0);

  readonly totalItems = computed(() =>
    this.cartItemsSignal().reduce((sum, item) => sum + item.cantidad, 0)
  );

  readonly totalPrice = computed(() =>
    this.cartItemsSignal().reduce(
      (sum, item) => {
        const precio = item.producto.precio + (item.variante?.precio_adicional ?? 0);
        return sum + precio * item.cantidad;
      },
      0
    )
  );

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadCartFromDB();
      } else {
        this.cartItemsSignal.set([]);
        this.dbIdMap.clear();
      }
    });
  }

  private mapDBItem(item: CartDBItem): CarritoItem | null {
    if (!item.productos) return null;
    let variante: Variante | undefined;
    if (item.variantes_producto) {
      variante = {
        id: item.variantes_producto.id,
        producto_id: item.producto_id,
        nombre_variante: item.variantes_producto.nombre_variante,
        tipo_variante: item.variantes_producto.tipo_variante,
        color: item.variantes_producto.color,
        stock: item.variantes_producto.stock,
        precio_adicional: item.variantes_producto.precio_adicional,
        imagen_url: item.variantes_producto.imagen_url,
      };
    }
    return {
      producto: {
        id: item.productos.id,
        nombre: item.productos.nombre,
        precio: item.productos.precio,
        imagen_url: item.productos.imagen_url,
        stock: item.productos.stock,
        categoria: '',
        descripcion: '',
      },
      variante,
      cantidad: item.cantidad,
    };
  }

  private async loadCartFromDB(): Promise<void> {
    try {
      const serverData = await firstValueFrom(this.checkoutService.getCarrito());
      const items: CarritoItem[] = [];
      this.dbIdMap.clear();
      for (const item of serverData ?? []) {
        const mapped = this.mapDBItem(item);
        if (mapped) {
          items.push(mapped);
          this.dbIdMap.set(
            cartKey(item.producto_id, item.variante_id),
            item.id
          );
        }
      }
      this.cartItemsSignal.set(items);
    } catch (err) {
      console.error('[CartService] Error loading cart from DB:', err);
      this.cartItemsSignal.set([]);
    }
  }

  async addItem(producto: Producto, cantidad: number = 1, variante?: Variante | null): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.checkoutService.addToCarrito(producto.id, cantidad, variante?.id)
      );
      if (resp) {
        this.dbIdMap.set(cartKey(producto.id, variante?.id), resp.id);
      }
      this.cartItemsSignal.update((items) => {
        const existing = items.find(
          (item) =>
            item.producto.id === producto.id &&
            (item.variante?.id ?? null) === (variante?.id ?? null)
        );
        if (existing) {
          return items.map((item) =>
            item.producto.id === producto.id &&
            (item.variante?.id ?? null) === (variante?.id ?? null)
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          );
        }
        return [...items, { producto, variante, cantidad }];
      });
    } catch (err) {
      console.error('[CartService] addItem falló:', err);
    }
  }

  async removeItem(productoId: number, varianteId?: number | null): Promise<void> {
    const key = cartKey(productoId, varianteId);
    const itemId = this.dbIdMap.get(key);
    if (itemId) {
      try {
        await firstValueFrom(this.checkoutService.removeCarritoItem(itemId));
      } catch (err) {
        console.error('[CartService] removeItem falló:', err);
      }
    }
    this.cartItemsSignal.update((items) =>
      items.filter(
        (item) =>
          !(item.producto.id === productoId &&
            (item.variante?.id ?? null) === (varianteId ?? null))
      )
    );
    this.dbIdMap.delete(key);
  }

  async updateQuantity(productoId: number, cantidad: number, varianteId?: number | null): Promise<void> {
    if (cantidad <= 0) {
      await this.removeItem(productoId, varianteId);
      return;
    }

    const key = cartKey(productoId, varianteId);
    const itemId = this.dbIdMap.get(key);
    if (itemId) {
      try {
        await firstValueFrom(this.checkoutService.updateCarritoItem(itemId, cantidad));
      } catch (err) {
        console.error('[CartService] updateQuantity falló:', err);
      }
    }
    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.producto.id === productoId &&
        (item.variante?.id ?? null) === (varianteId ?? null)
          ? { ...item, cantidad }
          : item
      )
    );
  }

  async clearCart(): Promise<void> {
    try {
      await firstValueFrom(this.checkoutService.clearCarrito());
    } catch (err) {
      console.error('[CartService] clearCart falló:', err);
    }
    this.cartItemsSignal.set([]);
    this.dbIdMap.clear();
  }
}
