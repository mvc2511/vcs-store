import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Producto, CarritoItem } from '../models/product.model';
import { CheckoutService } from '../../core/services/checkout.service';
import { AuthService } from '../../core/services/auth.service';

interface CartDBItem {
  id: number;
  producto_id: number;
  cantidad: number;
  productos?: {
    id: number;
    nombre: string;
    precio: number;
    imagen_url: string;
    stock: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'vcs_cart';

  private checkoutService = inject(CheckoutService);
  private authService = inject(AuthService);

  private cartItemsSignal = signal<CarritoItem[]>([]);
  private dbIdMap = new Map<number, number>();

  readonly cartItems = this.cartItemsSignal.asReadonly();

  readonly totalItems = computed(() =>
    this.cartItemsSignal().reduce((sum, item) => sum + item.cantidad, 0)
  );

  readonly totalPrice = computed(() =>
    this.cartItemsSignal().reduce(
      (sum, item) => sum + item.producto.precio * item.cantidad,
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
      cantidad: item.cantidad,
    };
  }

  private async syncAfterLogin(): Promise<void> {
    const localItems = this.loadFromStorage();

    try {
      const serverData = await firstValueFrom(this.checkoutService.getCarrito());
      const serverItems: CarritoItem[] = [];
      this.dbIdMap.clear();
      for (const item of serverData ?? []) {
        const mapped = this.mapDBItem(item);
        if (mapped) {
          serverItems.push(mapped);
          this.dbIdMap.set(item.producto_id, item.id);
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
    } catch {
      if (localItems.length > 0) {
        this.cartItemsSignal.set(localItems);
      }
    }
  }

  private async pushLocalToServer(items: CarritoItem[]): Promise<void> {
    try {
      for (const item of items) {
        const resp = await firstValueFrom(
          this.checkoutService.addToCarrito(item.producto.id, item.cantidad)
        );
        if (resp) {
          this.dbIdMap.set(item.producto.id, resp.id);
        }
      }
      this.cartItemsSignal.set(items);
      this.saveToStorage(items);
    } catch {
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

    const mergedMap = new Map<number, CarritoItem>();
    for (const item of server) {
      mergedMap.set(item.producto.id, { ...item });
    }
    for (const item of local) {
      const existing = mergedMap.get(item.producto.id);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        mergedMap.set(item.producto.id, { ...item });
      }
    }
    const merged = Array.from(mergedMap.values());
    await this.pushLocalToServer(merged);
    this.localCartItems.set([]);
    this.serverCartItems.set([]);
  }

  addItem(producto: Producto, cantidad: number = 1): void {
    if (this.authService.isLoggedIn()) {
      this.addItemAPI(producto, cantidad);
    } else {
      this.addItemLocal(producto, cantidad);
    }
  }

  private addItemLocal(producto: Producto, cantidad: number): void {
    this.cartItemsSignal.update((items) => {
      const existing = items.find((item) => item.producto.id === producto.id);
      if (existing) {
        return items.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...items, { producto, cantidad }];
    });
    this.saveToStorage(this.cartItemsSignal());
  }

  private async addItemAPI(producto: Producto, cantidad: number): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.checkoutService.addToCarrito(producto.id, cantidad)
      );
      if (resp) {
        this.dbIdMap.set(producto.id, resp.id);
      }
      this.cartItemsSignal.update((items) => {
        const existing = items.find((item) => item.producto.id === producto.id);
        if (existing) {
          return items.map((item) =>
            item.producto.id === producto.id
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item
          );
        }
        return [...items, { producto, cantidad }];
      });
    } catch {
      this.addItemLocal(producto, cantidad);
    }
  }

  removeItem(productoId: number): void {
    if (this.authService.isLoggedIn()) {
      this.removeItemAPI(productoId);
    } else {
      this.removeItemLocal(productoId);
    }
  }

  private removeItemLocal(productoId: number): void {
    this.cartItemsSignal.update((items) =>
      items.filter((item) => item.producto.id !== productoId)
    );
    this.saveToStorage(this.cartItemsSignal());
  }

  private async removeItemAPI(productoId: number): Promise<void> {
    const itemId = this.dbIdMap.get(productoId);
    if (itemId) {
      try {
        await firstValueFrom(this.checkoutService.removeCarritoItem(itemId));
      } catch {}
    }
    this.cartItemsSignal.update((items) =>
      items.filter((item) => item.producto.id !== productoId)
    );
    this.dbIdMap.delete(productoId);
  }

  updateQuantity(productoId: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.removeItem(productoId);
      return;
    }

    if (this.authService.isLoggedIn()) {
      this.updateQuantityAPI(productoId, cantidad);
    } else {
      this.updateQuantityLocal(productoId, cantidad);
    }
  }

  private updateQuantityLocal(productoId: number, cantidad: number): void {
    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item
      )
    );
    this.saveToStorage(this.cartItemsSignal());
  }

  private async updateQuantityAPI(productoId: number, cantidad: number): Promise<void> {
    const itemId = this.dbIdMap.get(productoId);
    if (itemId) {
      try {
        await firstValueFrom(this.checkoutService.updateCarritoItem(itemId, cantidad));
      } catch {}
    }
    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item
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
    } catch {}
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
