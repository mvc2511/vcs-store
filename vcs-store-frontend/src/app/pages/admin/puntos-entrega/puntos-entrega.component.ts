import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface PuntoEntrega {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-puntos-entrega',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './puntos-entrega.component.html',
  styleUrl: './puntos-entrega.component.scss',
})
export class PuntosEntregaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({ nombre: ['', Validators.required] });
  puntos: PuntoEntrega[] = [];
  creando = false;
  editandoId: number | null = null;
  editNombre = '';
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.http.get<PuntoEntrega[]>(`${environment.apiUrl}/api/puntos-entrega`).subscribe({
      next: (data) => (this.puntos = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crear(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/api/puntos-entrega`, this.form.value, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset();
        this.creando = false;
        this.cargar();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear punto de entrega';
      },
    });
  }

  iniciarEdit(punto: PuntoEntrega): void {
    this.editandoId = punto.id;
    this.editNombre = punto.nombre;
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number, nuevoNombre: string): void {
    if (!nuevoNombre.trim() || nuevoNombre.trim() === this.editNombre) {
      this.cancelarEdit();
      return;
    }

    this.http.put(`${environment.apiUrl}/api/puntos-entrega/${id}`, { nombre: nuevoNombre.trim() }, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.editandoId = null;
        this.cargar();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al actualizar punto de entrega';
        this.cancelarEdit();
      },
    });
  }

  eliminar(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/puntos-entrega/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargar();
      },
      error: () => {
        this.eliminandoId = null;
        this.errorMsg = 'Error al eliminar punto de entrega';
      },
    });
  }
}
