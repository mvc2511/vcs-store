import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Orden {
  id: number;
  user_id: string;
  user_email: string | null;
  total: number;
  estado: string;
  telefono_contacto: string | null;
  fecha_entrega: string | null;
  hora_entrega: string | null;
  creado_en: string;
  updated_at: string;
  puntos_entrega: { nombre: string } | null;
  detalles_orden: DetalleOrden[];
}

interface DetalleOrden {
  id: number;
  cantidad: number;
  precio_unitario: number;
  productos: { nombre: string } | null;
}

@Component({
  selector: 'app-admin-ordenes',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './admin-ordenes.component.html',
  styleUrl: './admin-ordenes.component.scss',
})
export class AdminOrdenesComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  ordenes = signal<Orden[]>([]);
  loading = signal(true);
  filtroEstado = signal('');
  expandedId = signal<number | null>(null);
  updatingId = signal<number | null>(null);
  horariosEntrega = signal<{ id: number; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>([]);
  editingEntregaId = signal<number | null>(null);
  editFecha = signal('');
  editHora = signal('');

  private readonly DIAS: Record<number, string> = { 6: 'Sábado', 7: 'Domingo' };

  formatHorario(h: { dia_semana: number; hora_inicio: string; hora_fin: string }): string {
    const dia = this.DIAS[h.dia_semana] || '';
    const inicio = h.hora_inicio.slice(0, 5);
    const fin = h.hora_fin.slice(0, 5);
    return `${dia} ${inicio} - ${fin}`;
  }

  readonly ESTADOS = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

  ngOnInit(): void {
    this.cargarOrdenes();
    this.http.get<{ id: number; dia_semana: number; hora_inicio: string; hora_fin: string; activo: boolean }[]>(`${environment.apiUrl}/api/horarios-entrega`).subscribe({
      next: (data) => this.horariosEntrega.set(data.filter(h => h.activo)),
    });
  }

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
    const val = this.editFecha();
    if (!val) return;
    const d = new Date(val + 'T12:00:00');
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      this.editFecha.set('');
    }
  }

  private getHeaders() {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  cargarOrdenes(): void {
    this.loading.set(true);
    const url = this.filtroEstado()
      ? `${environment.apiUrl}/api/admin/ordenes?estado=${this.filtroEstado()}`
      : `${environment.apiUrl}/api/admin/ordenes`;
    this.http.get<Orden[]>(url, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.ordenes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cambiarEstado(ordenId: number, nuevoEstado: string): void {
    this.updatingId.set(ordenId);
    this.http
      .put(
        `${environment.apiUrl}/api/admin/ordenes/${ordenId}/estado`,
        { estado: nuevoEstado },
        { headers: this.getHeaders() }
      )
      .subscribe({
        next: () => {
          this.updatingId.set(null);
          this.cargarOrdenes();
        },
        error: () => {
          this.updatingId.set(null);
          alert('Error al actualizar el estado');
        },
      });
  }

  toggleExpand(ordenId: number): void {
    this.expandedId.set(this.expandedId() === ordenId ? null : ordenId);
  }

  startEditEntrega(orden: Orden): void {
    this.editingEntregaId.set(orden.id);
    this.editFecha.set(orden.fecha_entrega || '');
    this.editHora.set(orden.hora_entrega || '');
  }

  cancelEditEntrega(): void {
    this.editingEntregaId.set(null);
  }

  guardarEntrega(ordenId: number): void {
    const data: any = {};
    if (this.editFecha()) data.fecha_entrega = this.editFecha();
    if (this.editHora()) data.hora_entrega = this.editHora();
    if (!data.fecha_entrega && !data.hora_entrega) return;

    this.http
      .put(`${environment.apiUrl}/api/admin/ordenes/${ordenId}`, data, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.editingEntregaId.set(null);
          this.cargarOrdenes();
        },
        error: () => alert('Error al guardar la fecha/hora de entrega'),
      });
  }
}
