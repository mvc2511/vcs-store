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

  enviarCarritoAlBackend(carrito: any[]): Observable<any> {
    const token = this.authService.sessionToken();

    const headers = new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );

    return this.http.post(`${environment.apiUrl}/api/checkout/create-session`, carrito, {
      headers,
    });
  }
}
