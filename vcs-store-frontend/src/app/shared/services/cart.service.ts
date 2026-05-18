import { Injectable, signal, computed, effect } from '@angular/core';
import { Producto, CarritoItem } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'vcs_cart';

  private cartItemsSignal = signal<CarritoItem[]>(this.loadFromStorage());

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

  constructor() {
    effect(() => {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.cartItemsSignal())
      );
    });
  }

  addItem(producto: Producto, cantidad: number = 1): void {
    this.cartItemsSignal.update((items) => {
      const existing = items.find(
        (item) => item.producto.id === producto.id
      );
      if (existing) {
        return items.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [...items, { producto, cantidad }];
    });
  }

  removeItem(productoId: number): void {
    this.cartItemsSignal.update((items) =>
      items.filter((item) => item.producto.id !== productoId)
    );
  }

  updateQuantity(productoId: number, cantidad: number): void {
    if (cantidad <= 0) {
      this.removeItem(productoId);
      return;
    }
    this.cartItemsSignal.update((items) =>
      items.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad } : item
      )
    );
  }

  clearCart(): void {
    this.cartItemsSignal.set([]);
  }

  private loadFromStorage(): CarritoItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
