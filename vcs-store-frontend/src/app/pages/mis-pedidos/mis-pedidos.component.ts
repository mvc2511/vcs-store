import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environments';

interface Orden {
  id: number;
  total: number;
  estado: string;
  telefono_contacto: string | null;
  fecha_entrega: string | null;
  hora_entrega: string | null;
  creado_en: string;
  puntos_entrega: { nombre: string } | null;
  detalles_orden: DetalleOrden[];
}

interface DetalleOrden {
  cantidad: number;
  precio_unitario: number;
  productos: { nombre: string } | null;
}

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.css',
})
export class MisPedidosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  ordenes = signal<Orden[]>([]);
  loading = signal(true);
  cancelandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  private getHeaders() {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  cargarOrdenes(): void {
    this.http.get<Orden[]>(`${environment.apiUrl}/api/mis-ordenes`, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.ordenes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cancelarOrden(ordenId: number): void {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) return;
    this.cancelandoId.set(ordenId);
    this.http
      .put(`${environment.apiUrl}/api/mis-ordenes/${ordenId}/cancelar`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.cancelandoId.set(null);
          this.cargarOrdenes();
        },
        error: (err) => {
          this.cancelandoId.set(null);
          const msg = err.error?.detail || 'Error al cancelar la orden';
          alert(msg);
        },
      });
  }

  isCancelable(estado: string): boolean {
    return estado === 'pendiente';
  }
}
