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

  private getHeaders(token: string | null): HttpHeaders {
    return new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );
  }

  enviarCarritoAlBackend(carrito: any[]): Observable<any> {
    const token = this.authService.sessionToken();
    return this.http.post(
      `${environment.apiUrl}/api/checkout/create-session`,
      carrito,
      { headers: this.getHeaders(token) }
    );
  }

  crearOrdenCOD(items: { producto_id: number; cantidad: number }[]): Observable<any> {
    const token = this.authService.sessionToken();
    return this.http.post(
      `${environment.apiUrl}/api/checkout/cod`,
      { items },
      { headers: this.getHeaders(token) }
    );
  }
}
