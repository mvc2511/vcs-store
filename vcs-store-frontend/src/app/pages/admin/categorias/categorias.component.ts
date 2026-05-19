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
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Categorías</h1>
          <p class="page-desc">Organizá los productos por categorías.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="crearCategoria()" class="cat-form">
        <div class="form-row">
          <input formControlName="nombre" type="text" placeholder="Nombre de la categoría" />
          <button type="submit" class="btn-primary" [disabled]="form.invalid || creando">
            {{ creando ? 'Agregando...' : 'Agregar' }}
          </button>
        </div>
        <div *ngIf="errorMsg" class="msg-error">{{ errorMsg }}</div>
      </form>

      <div class="cat-list">
        <div *ngFor="let cat of categorias" class="cat-item">
          <div *ngIf="editandoId !== cat.id; else editTmpl" class="cat-info">
            <span class="cat-name">{{ cat.nombre }}</span>
            <span class="cat-id">#{{ cat.id }}</span>
          </div>

          <ng-template #editTmpl>
            <input
              #editInput
              [value]="editNombre"
              (keyup.enter)="guardarEdit(cat.id, editInput.value)"
              (keyup.escape)="cancelarEdit()"
              (blur)="guardarEdit(cat.id, editInput.value)"
              class="edit-input"
              autofocus
            />
          </ng-template>

          <div class="row-acts" *ngIf="editandoId !== cat.id">
            <button class="act-btn" title="Editar" (click)="iniciarEdit(cat)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="act-btn danger" title="Eliminar" (click)="eliminarCategoria(cat.id)" [disabled]="eliminandoId === cat.id">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div *ngIf="categorias.length === 0" class="empty-state">
          No hay categorías. Creá la primera.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-head {
      margin-bottom: 1.5rem;
    }
    .page-head h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.2rem; }
    .page-desc { color: var(--text-secondary); font-size: 0.9rem; }
    .cat-form {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.15rem;
      margin-bottom: 1.25rem;
    }
    .form-row { display: flex; gap: 0.65rem; }
    .form-row input {
      flex: 1;
      padding: 0.6rem 0.8rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-family: inherit;
      background: var(--bg);
      color: var(--text);
      outline: none;
      transition: border-color 0.2s;
    }
    .form-row input:focus { border-color: var(--primary); }
    .form-row input::placeholder { color: var(--text-secondary); opacity: 0.5; }
    .btn-primary {
      padding: 0.6rem 1.2rem;
      background: var(--gradient);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.88rem;
      white-space: nowrap;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .msg-error {
      margin-top: 0.65rem;
      padding: 0.55rem 0.85rem;
      background: rgba(255, 107, 107, 0.08);
      color: var(--secondary);
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
    }
    .cat-list {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .cat-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.15rem;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    .cat-item:last-child { border-bottom: none; }
    .cat-item:hover { background: #f8f8fc; }
    .cat-info { display: flex; align-items: center; gap: 0.65rem; }
    .cat-name { font-weight: 500; font-size: 0.9rem; }
    .cat-id { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }
    .edit-input {
      width: 100%;
      padding: 0.35rem 0.6rem;
      border: 1.5px solid var(--primary);
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      background: rgba(108, 63, 236, 0.04);
      color: var(--text);
      outline: none;
    }
    .row-acts { display: flex; gap: 0.15rem; }
    .act-btn {
      width: 30px; height: 30px;
      border: none; border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      cursor: pointer;
      background: transparent;
      color: var(--text-secondary);
    }
    .act-btn:hover { background: #f0f0f5; color: var(--text); }
    .act-btn.danger:hover { background: rgba(255, 107, 107, 0.08); color: var(--secondary); }
    .act-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .empty-state {
      padding: 1.75rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.88rem;
    }
  `],
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
