import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Talla {
  id: number;
  nombre: string;
  orden: number;
}

@Component({
  selector: 'app-tallas',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './tallas.component.html',
  styleUrl: './tallas.component.scss',
})
export class TallasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({ nombre: ['', Validators.required], orden: [0] });
  tallas: Talla[] = [];
  creando = false;
  editandoId: number | null = null;
  editNombre = '';
  editOrden = 0;
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargarTallas();
  }

  private cargarTallas(): void {
    this.http.get<Talla[]>(`${environment.apiUrl}/api/tallas`).subscribe({
      next: (data) => (this.tallas = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crearTalla(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/api/tallas`, this.form.value, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset({ orden: 0 });
        this.creando = false;
        this.cargarTallas();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear talla';
      },
    });
  }

  iniciarEdit(t: Talla): void {
    this.editandoId = t.id;
    this.editNombre = t.nombre;
    this.editOrden = t.orden;
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number): void {
    if (!this.editNombre.trim()) { this.cancelarEdit(); return; }
    this.http.put(`${environment.apiUrl}/api/tallas/${id}`, { nombre: this.editNombre.trim(), orden: this.editOrden }, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.editandoId = null; this.cargarTallas(); },
      error: (err) => { this.errorMsg = err.error?.detail || 'Error al actualizar talla'; this.cancelarEdit(); },
    });
  }

  eliminarTalla(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/tallas/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.eliminandoId = null; this.cargarTallas(); },
      error: () => { this.eliminandoId = null; this.errorMsg = 'Error al eliminar talla'; },
    });
  }
}
