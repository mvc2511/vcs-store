import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UploadImageComponent } from '../../../shared/components/upload-image/upload-image.component';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, UploadImageComponent],
  template: `
    <div class="admin-page">
      <div class="admin-header">
        <a routerLink="/" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </a>
        <h1>Nuevo Producto</h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="producto-form" *ngIf="!exito">
        <div class="form-grid">
          <div class="form-group">
            <label for="nombre">Nombre</label>
            <input id="nombre" formControlName="nombre" type="text" placeholder="Nombre del producto" />
          </div>

          <div class="form-group">
            <label for="precio">Precio</label>
            <input id="precio" formControlName="precio" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>

          <div class="form-group">
            <label for="stock">Stock</label>
            <input id="stock" formControlName="stock" type="number" min="0" placeholder="0" />
          </div>

          <div class="form-group">
            <label for="categoria">Categoría</label>
            <select id="categoria" formControlName="categoria_id">
              <option [ngValue]="null">Sin categoría</option>
              <option *ngFor="let cat of categorias" [ngValue]="cat.id">{{ cat.nombre }}</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label for="descripcion">Descripción</label>
            <textarea id="descripcion" formControlName="descripcion" rows="3" placeholder="Descripción del producto"></textarea>
          </div>

          <div class="form-group full-width">
            <label>Imagen</label>
            <app-upload-image (urlSubida)="onUrlSubida($event)" />
          </div>
        </div>

        <div *ngIf="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button type="submit" class="submit-btn" [disabled]="form.invalid || enviando">
          <div *ngIf="enviando" class="btn-spinner"></div>
          <span>{{ enviando ? 'Guardando...' : 'Guardar Producto' }}</span>
        </button>
      </form>

      <div *ngIf="exito" class="exito-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h2>Producto creado exitosamente</h2>
        <button class="submit-btn" routerLink="/admin/productos/nuevo">Agregar otro</button>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 720px;
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
    .back-link:hover {
      color: var(--primary);
    }
    .producto-form {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 2rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-group.full-width {
      grid-column: 1 / -1;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
      padding: 0.65rem 0.85rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-family: inherit;
      background: var(--bg);
      color: var(--text);
      transition: border-color 0.2s;
      outline: none;
    }
    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      border-color: var(--primary);
    }
    .form-group textarea {
      resize: vertical;
    }
    .error-msg {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 107, 107, 0.1);
      color: var(--secondary);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .submit-btn {
      margin-top: 1.5rem;
      width: 100%;
      padding: 0.85rem;
      background: var(--gradient);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s;
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .submit-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .exito-card {
      text-align: center;
      padding: 3rem 2rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .exito-card h2 {
      margin: 1rem 0 1.5rem;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .exito-card .submit-btn {
      max-width: 280px;
      margin: 0 auto;
    }
  `],
})
export class NuevoProductoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    precio: ['', [Validators.required, Validators.min(0.01)]],
    stock: ['', [Validators.required, Validators.min(0)]],
    categoria_id: [null as number | null],
  });

  categorias: Categoria[] = [];
  enviando = false;
  exito = false;
  errorMsg = '';
  private imagenUrl = '';

  ngOnInit(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/api/categorias`).subscribe({
      next: (data) => (this.categorias = data),
    });
  }

  onUrlSubida(url: string): void {
    this.imagenUrl = url;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.imagenUrl) return;

    this.enviando = true;
    this.errorMsg = '';

    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );

    const body: Record<string, unknown> = {
      nombre: this.form.value.nombre,
      descripcion: this.form.value.descripcion,
      precio: parseFloat(this.form.value.precio ?? '0'),
      stock: parseInt(this.form.value.stock ?? '0', 10),
      imagen_url: this.imagenUrl,
    };

    if (this.form.value.categoria_id) {
      body['categoria_id'] = this.form.value.categoria_id;
    }

    this.http.post(`${environment.apiUrl}/api/productos`, body, { headers }).subscribe({
      next: () => {
        this.enviando = false;
        this.exito = true;
      },
      error: (err) => {
        this.enviando = false;
        this.errorMsg = err.error?.detail || 'Error al crear el producto';
      },
    });
  }
}
