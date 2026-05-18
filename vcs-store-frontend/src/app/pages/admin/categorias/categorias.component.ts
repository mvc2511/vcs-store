import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, RouterLink],
  template: `
    <div class="admin-page">
      <div class="admin-header">
        <a routerLink="/admin/productos/nuevo" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </a>
        <h1>Categorías</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="crearCategoria()" class="categoria-form">
        <div class="form-row">
          <input formControlName="nombre" type="text" placeholder="Nombre de la categoría" />
          <button type="submit" class="btn-primary" [disabled]="form.invalid || creando">
            {{ creando ? 'Agregando...' : 'Agregar' }}
          </button>
        </div>
      </form>

      <div *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <div class="categoria-list">
        <div *ngFor="let cat of categorias" class="categoria-item">
          <span class="categoria-nombre">{{ cat.nombre }}</span>
          <button class="btn-delete" (click)="eliminarCategoria(cat.id)" [disabled]="eliminandoId === cat.id">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
        <div *ngIf="categorias.length === 0" class="empty">
          No hay categorías. Crea la primera.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .admin-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .admin-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .back-link {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--primary); }
    .categoria-form {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .form-row {
      display: flex;
      gap: 0.75rem;
    }
    .form-row input {
      flex: 1;
      padding: 0.65rem 0.85rem;
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
    .btn-primary {
      padding: 0.65rem 1.25rem;
      background: var(--gradient);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.9rem;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .error-msg {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 107, 107, 0.1);
      color: var(--secondary);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .categoria-list {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .categoria-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    .categoria-item:last-child { border-bottom: none; }
    .categoria-nombre {
      font-weight: 500;
      color: var(--text);
    }
    .btn-delete {
      width: 34px;
      height: 34px;
      border: 1.5px solid var(--border);
      background: transparent;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    .btn-delete:hover:not(:disabled) {
      border-color: var(--secondary);
      color: var(--secondary);
      background: rgba(255, 107, 107, 0.06);
    }
    .btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }
    .empty {
      padding: 2rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
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

  crearCategoria(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

    this.http.post(`${environment.apiUrl}/api/categorias`, this.form.value, { headers }).subscribe({
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

  eliminarCategoria(id: number): void {
    this.eliminandoId = id;
    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

    this.http.delete(`${environment.apiUrl}/api/categorias/${id}`, { headers }).subscribe({
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
