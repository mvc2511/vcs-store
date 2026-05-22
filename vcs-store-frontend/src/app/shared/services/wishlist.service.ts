import { Injectable, signal, inject, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environments';
import { AuthService } from '../../core/services/auth.service';
import { Producto } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private wishlistIdsSignal = signal<Set<number>>(new Set());
  private wishlistItemsSignal = signal<Producto[]>([]);

  readonly wishlistIds = this.wishlistIdsSignal.asReadonly();
  readonly wishlistItems = this.wishlistItemsSignal.asReadonly();
  readonly count = signal(0);

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadWishlist();
      } else {
        this.wishlistIdsSignal.set(new Set());
        this.wishlistItemsSignal.set([]);
        this.count.set(0);
      }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    if (!token) throw new Error('No hay sesión activa');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  async loadWishlist(): Promise<void> {
    try {
      const items = await firstValueFrom(
        this.http.get<Producto[]>(`${environment.apiUrl}/api/favoritos`, {
          headers: this.getHeaders(),
        })
      );
      this.wishlistItemsSignal.set(items ?? []);
      this.wishlistIdsSignal.set(new Set((items ?? []).map((p) => p.id)));
      this.count.set((items ?? []).length);
    } catch (err) {
      console.error('[WishlistService] Error loading wishlist:', err);
      this.wishlistItemsSignal.set([]);
      this.wishlistIdsSignal.set(new Set());
      this.count.set(0);
    }
  }

  async toggle(productoId: number): Promise<void> {
    if (!this.authService.isLoggedIn()) return;
    const isFav = this.wishlistIdsSignal().has(productoId);
    try {
      if (isFav) {
        await firstValueFrom(
          this.http.delete(`${environment.apiUrl}/api/favoritos/${productoId}`, {
            headers: this.getHeaders(),
          })
        );
      } else {
        await firstValueFrom(
          this.http.post(
            `${environment.apiUrl}/api/favoritos`,
            { producto_id: productoId },
            { headers: this.getHeaders() }
          )
        );
      }
      this.wishlistIdsSignal.update((set) => {
        const newSet = new Set(set);
        if (isFav) newSet.delete(productoId);
        else newSet.add(productoId);
        return newSet;
      });
      this.count.update((c) => (isFav ? c - 1 : c + 1));
    } catch (err) {
      console.error('[WishlistService] toggle falló:', err);
    }
  }

  isFavorited(productoId: number): boolean {
    return this.wishlistIdsSignal().has(productoId);
  }

  async check(productoId: number): Promise<boolean> {
    try {
      const resp = await firstValueFrom(
        this.http.get<{ favorito: boolean }>(
          `${environment.apiUrl}/api/favoritos/check?producto_id=${productoId}`,
          { headers: this.getHeaders() }
        )
      );
      return resp?.favorito ?? false;
    } catch {
      return false;
    }
  }
}
