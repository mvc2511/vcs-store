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
    talla: string | null;
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
  private readonly STORAGE_KEY = 'vcs_cart';

  private checkoutService = inject(CheckoutService);
  private authService = inject(AuthService);

  private cartItemsSignal = signal<CarritoItem[]>([]);
  private dbIdMap = new Map<string, number>();

  readonly cartItems = this.cartItemsSignal.asReadonly();

  // Stock warnings
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

  mergePending = signal(false);
  localCartItems = signal<CarritoItem[]>([]);
  serverCartItems = signal<CarritoItem[]>([]);

  constructor() {
    if (!this.authService.isLoggedIn()) {
      this.cartItemsSignal.set(this.loadFromStorage());
    }

    effect(() => {
      const loggedIn = this.authService.isLoggedIn();
      if (loggedIn) {
        this.syncAfterLogin();
      } else {
        this.cartItemsSignal.set(this.loadFromStorage());
        this.dbIdMap.clear();
        this.mergePending.set(false);
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
        talla: item.variantes_producto.talla,
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

  private async syncAfterLogin(): Promise<void> {
    const localItems = this.loadFromStorage();

    try {
      let attempts = 0;
      while (!this.authService.sessionToken() && attempts < 30) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }
      if (!this.authService.sessionToken()) {
        console.error('[CartService] No se pudo obtener token tras login, usando localStorage');
        if (localItems.length > 0) {
          this.cartItemsSignal.set(localItems);
        }
        return;
      }

      const serverData = await firstValueFrom(this.checkoutService.getCarrito());
      const serverItems: CarritoItem[] = [];
      this.dbIdMap.clear();
      for (const item of serverData ?? []) {
        const mapped = this.mapDBItem(item);
        if (mapped) {
          serverItems.push(mapped);
          this.dbIdMap.set(
            cartKey(item.producto_id, item.variante_id),
            item.id
          );
        }
      }

      if (localItems.length > 0 && serverItems.length > 0) {
        this.localCartItems.set(localItems);
        this.serverCartItems.set(serverItems);
        this.mergePending.set(true);
        return;
      }

      if (serverItems.length > 0) {
        this.cartItemsSignal.set(serverItems);
        this.saveToStorage(serverItems);
      } else if (localItems.length > 0) {
        await this.pushLocalToServer(localItems);
      } else {
        this.cartItemsSignal.set([]);
        this.saveToStorage([]);
      }
    } catch (err) {
      console.error('[CartService] Error syncing cart after login:', err);
      if (localItems.length > 0) {
        this.cartItemsSignal.set(localItems);
      }
    }
  }

  private async pushLocalToServer(items: CarritoItem[]): Promise<void> {
    try {
      for (const item of items) {
        const resp = await firstValueFrom(
          this.checkoutService.addToCarrito(
            item.producto.id,
            item.cantidad,
            item.variante?.id
          )
        );
        if (resp) {
          this.dbIdMap.set(
            cartKey(item.producto.id, item.variante?.id),
            resp.id
          );
        }
      }
      this.cartItemsSignal.set(items);
      this.saveToStorage(items);
    } catch (err) {
      console.error('[CartService] pushLocalToServer falló:', err);
      this.cartItemsSignal.set(items);
      this.saveToStorage(items);
    }
  }

  async applyMergeDecision(decision: 'server' | 'local' | 'merge'): Promise<void> {
    this.mergePending.set(false);
    const local = this.localCartItems();
    const server = this.serverCartItems();

    if (decision === 'server') {
      this.cartItemsSignal.set(server);
      this.saveToStorage(server);
      this.localCartItems.set([]);
      this.serverCartItems.set([]);
      return;
    }

    if (decision === 'local') {
      await this.pushLocalToServer(local);
      this.localCartItems.set([]);
      this.serverCartItems.set([]);
      return;
    }

    const mergedMap = new Map<string, CarritoItem>();
    for (const item of server) {
      mergedMap.set(cartKey(item.producto.id, item.variante?.id), { ...item });
    }
    for (const item of local) {
      const key = cartKey(item.producto.id, item.variante?.id);
      const existing = mergedMap.get(key);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        mergedMap.set(key, { ...item });
      }
    }
    const merged = Array.from(mergedMap.values());
    await this.pushLocalToServer(merged);
    this.localCartItems.set([]);
    this.serverCartItems.set([]);
  }

  addItem(producto: Producto, cantidad: number = 1, variante?: Variante | null): void {
    if (this.authService.isLoggedIn()) {
      this.addItemAPI(producto, cantidad, variante);
    } else {
      this.addItemLocal(producto, cantidad, variante);
    }
  }

  private addItemLocal(producto: Producto, cantidad: number, variante?: Variante | null): void {
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
    this.saveToStorage(this.cartItemsSignal());
  }

  private async addItemAPI(producto: Producto, cantidad: number, variante?: Variante | null): Promise<void> {
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
      console.error('[CartService] addItemAPI falló, usando localStorage:', err);
      this.addItemLocal(producto, cantidad, variante);
    }
  }

  removeItem(productoId: number, varianteId?: number | null): void {
    if (this.authService.isLoggedIn()) {
      this.removeItemAPI(productoId, varianteId);
    } else {
      this.removeItemLocal(productoId, varianteId);
    }
  }

  private removeItemLocal(productoId: number, varianteId?: number | null): void {
    this.cartItemsSignal.update((items) =>
      items.filter(
        (item) =>
          !(item.producto.id === productoId &&
            (item.variante?.id ?? null) === (varianteId ?? null))
      )
    );
    this.saveToStorage(this.cartItemsSignal());
  }

  private async removeItemAPI(productoId: number, varianteId?: number | null): Promise<void> {
    const key = cartKey(productoId, varianteId);
    const itemId = this.dbIdMap.get(key);
    if (itemId) {
      try {
        await firstValueFrom(this.checkoutService.removeCarritoItem(itemId));
      } catch (err) {
        console.error('[CartService] removeItemAPI falló:', err);
      }
    } else {
      console.warn('[CartService] removeItemAPI: no dbIdMap entry for', key, '— cambios solo locales');
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

  updateQuantity(productoId: number, cantidad: number, varianteId?: number | null): void {
    if (cantidad <= 0) {
      this.removeItem(productoId, varianteId);
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.updateQuantityAPI(productoId, cantidad, varianteId);
    } else {
      this.updateQuantityLocal(productoId, cantidad, varianteId);
    }
  }

  private updateQuantityLocal(productoId: number, cantidad: number, varianteId?: number | null): void {
    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.producto.id === productoId &&
        (item.variante?.id ?? null) === (varianteId ?? null)
          ? { ...item, cantidad }
          : item
      )
    );
    this.saveToStorage(this.cartItemsSignal());
  }

  private async updateQuantityAPI(productoId: number, cantidad: number, varianteId?: number | null): Promise<void> {
    const key = cartKey(productoId, varianteId);
    const itemId = this.dbIdMap.get(key);
    if (itemId) {
      try {
        await firstValueFrom(this.checkoutService.updateCarritoItem(itemId, cantidad));
      } catch (err) {
        console.error('[CartService] updateQuantityAPI falló:', err);
      }
    } else {
      console.warn('[CartService] updateQuantityAPI: no dbIdMap entry for', key, '— cambios solo locales');
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

  clearCart(): void {
    if (this.authService.isLoggedIn()) {
      this.clearCartAPI();
    } else {
      this.clearCartLocal();
    }
  }

  private clearCartLocal(): void {
    this.cartItemsSignal.set([]);
    this.saveToStorage([]);
  }

  private async clearCartAPI(): Promise<void> {
    try {
      await firstValueFrom(this.checkoutService.clearCarrito());
    } catch (err) {
      console.error('[CartService] clearCartAPI falló:', err);
    }
    this.cartItemsSignal.set([]);
    this.dbIdMap.clear();
  }

  private loadFromStorage(): CarritoItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CarritoItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}
