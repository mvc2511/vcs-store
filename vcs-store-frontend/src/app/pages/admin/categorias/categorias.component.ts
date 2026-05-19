import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss',
})
export class CategoriasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({ nombre: ['', Validators.required] });
  categorias: Categoria[] = [];
  creando = false;
  editandoId: number | null = null;
  editNombre = '';
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargarCategorias();
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

  crearCategoria(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/api/categorias`, this.form.value, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset();
        this.creando = false;
        this.cargarCategorias();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear categoría';
      },
    });
  }

  iniciarEdit(cat: Categoria): void {
    this.editandoId = cat.id;
    this.editNombre = cat.nombre;
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number, nuevoNombre: string): void {
    if (!nuevoNombre.trim() || nuevoNombre.trim() === this.editNombre) {
      this.cancelarEdit();
      return;
    }

    this.http.put(`${environment.apiUrl}/api/categorias/${id}`, { nombre: nuevoNombre.trim() }, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.editandoId = null;
        this.cargarCategorias();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al actualizar categoría';
        this.cancelarEdit();
      },
    });
  }

  eliminarCategoria(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/categorias/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargarCategorias();
      },
      error: () => {
        this.eliminandoId = null;
        this.errorMsg = 'Error al eliminar categoría';
      },
    });
  }
}
