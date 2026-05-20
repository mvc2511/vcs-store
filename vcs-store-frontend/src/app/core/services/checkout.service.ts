import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    if (!token) {
      console.error('[CheckoutService] No hay token de sesión disponible');
      throw new Error('No hay sesión activa');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  enviarCarritoAlBackend(carrito: any[]): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/checkout/create-session`,
      carrito,
      { headers: this.getHeaders() }
    );
  }

  crearOrdenCOD(
    items: { producto_id: number; cantidad: number }[],
    punto_entrega_id: number,
    telefono_contacto: string,
    fecha_entrega?: string,
    hora_entrega?: string,
  ): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/checkout/cod`,
      { items, punto_entrega_id, telefono_contacto, fecha_entrega, hora_entrega },
      { headers: this.getHeaders() }
    );
  }

  getPuntosEntrega(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(
      `${environment.apiUrl}/api/puntos-entrega`
    );
  }

  getCarrito(): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/api/carrito`,
      { headers: this.getHeaders() }
    );
  }

  addToCarrito(producto_id: number, cantidad: number): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/api/carrito`,
      { producto_id, cantidad },
      { headers: this.getHeaders() }
    );
  }

  updateCarritoItem(item_id: number, cantidad: number): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/carrito/${item_id}`,
      { cantidad },
      { headers: this.getHeaders() }
    );
  }

  removeCarritoItem(item_id: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/api/carrito/${item_id}`,
      { headers: this.getHeaders() }
    );
  }

  clearCarrito(): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/api/carrito`,
      { headers: this.getHeaders() }
    );
  }

  updateOrden(orden_id: number, data: { fecha_entrega?: string; hora_entrega?: string }): Observable<any> {
    return this.http.put(
      `${environment.apiUrl}/api/admin/ordenes/${orden_id}`,
      data,
      { headers: this.getHeaders() }
    );
  }
}
