import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';
import { OpcionMl } from '../../../shared/models/product.model';

interface Categoria { id: number; nombre: string; }

@Component({
  selector: 'app-opciones-ml',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './opciones-ml.component.html',
  styleUrl: './opciones-ml.component.scss',
})
export class OpcionesMlComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({
    categoria_id: [null as number | null, Validators.required],
    ml: [0, [Validators.required, Validators.min(1)]],
    orden: [0],
  });

  opciones: (OpcionMl & { categoria_nombre?: string })[] = [];
  categorias: Categoria[] = [];
  creando = false;
  editandoId: number | null = null;
  editMl = 0;
  editOrden = 0;
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargarOpciones();
    this.cargarCategorias();
  }

  private cargarOpciones(): void {
    this.http.get<OpcionMl[]>(`${environment.apiUrl}/api/opciones-ml`).subscribe({
      next: (data) => {
        this.opciones = data.map(o => ({
          ...o,
          categoria_nombre: (o as any).categorias?.nombre || `ID ${o.categoria_id}`,
        }));
      },
    });
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/api/categorias`).subscribe({
      next: (data) => (this.categorias = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crearOpcion(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/api/opciones-ml`, this.form.value, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset({ categoria_id: null, ml: 0, orden: 0 });
        this.creando = false;
        this.cargarOpciones();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear opción de ml';
      },
    });
  }

  iniciarEdit(op: OpcionMl): void {
    this.editandoId = op.id;
    this.editMl = op.ml;
    this.editOrden = op.orden;
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number): void {
    if (this.editMl <= 0) {
      this.cancelarEdit();
      return;
    }

    this.http.put(`${environment.apiUrl}/api/opciones-ml/${id}`, { ml: this.editMl, orden: this.editOrden }, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.editandoId = null;
        this.cargarOpciones();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al actualizar opción de ml';
        this.cancelarEdit();
      },
    });
  }

  eliminarOpcion(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/opciones-ml/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargarOpciones();
      },
      error: () => {
        this.eliminandoId = null;
        this.errorMsg = 'Error al eliminar opción de ml';
      },
    });
  }
}
