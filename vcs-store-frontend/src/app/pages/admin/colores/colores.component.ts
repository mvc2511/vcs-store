import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Color {
  id: number;
  nombre: string;
  hex: string | null;
}

@Component({
  selector: 'app-colores',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './colores.component.html',
  styleUrl: './colores.component.scss',
})
export class ColoresComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({ nombre: ['', Validators.required], hex: [''] });
  colores: Color[] = [];
  creando = false;
  editandoId: number | null = null;
  editNombre = '';
  editHex = '';
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargarColores();
  }

  private cargarColores(): void {
    this.http.get<Color[]>(`${environment.apiUrl}/api/colores`).subscribe({
      next: (data) => (this.colores = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crearColor(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/api/colores`, this.form.value, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset();
        this.creando = false;
        this.cargarColores();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear color';
      },
    });
  }

  iniciarEdit(c: Color): void {
    this.editandoId = c.id;
    this.editNombre = c.nombre;
    this.editHex = c.hex || '';
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number): void {
    if (!this.editNombre.trim()) { this.cancelarEdit(); return; }
    const body: Record<string, string> = { nombre: this.editNombre.trim() };
    if (this.editHex.trim()) body['hex'] = this.editHex.trim();
    this.http.put(`${environment.apiUrl}/api/colores/${id}`, body, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.editandoId = null; this.cargarColores(); },
      error: (err) => { this.errorMsg = err.error?.detail || 'Error al actualizar color'; this.cancelarEdit(); },
    });
  }

  eliminarColor(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/colores/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.eliminandoId = null; this.cargarColores(); },
      error: () => { this.eliminandoId = null; this.errorMsg = 'Error al eliminar color'; },
    });
  }
}
