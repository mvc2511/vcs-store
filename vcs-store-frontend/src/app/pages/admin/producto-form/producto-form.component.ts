import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UploadImageComponent } from '../../../shared/components/upload-image/upload-image.component';
import { StorageService } from '../../../shared/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, RouterLink, UploadImageComponent],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>{{ editMode ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
          <p class="page-desc">{{ editMode ? 'Modificá los datos del producto.' : 'Agregá un nuevo producto al catálogo.' }}</p>
        </div>
        <a routerLink="/admin/productos" class="btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </a>
      </div>

      <div *ngIf="loading" class="load-state">
        <div class="spinner"></div>
        <span>Cargando producto...</span>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-form" *ngIf="!loading && !exito">
        <div class="form-grid">
          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" formControlName="nombre" type="text" placeholder="Nombre del producto" />
          </div>

          <div class="field">
            <label for="precio">Precio</label>
            <input id="precio" formControlName="precio" type="number" step="0.01" min="0" placeholder="0.00" />
          </div>

          <div class="field">
            <label for="stock">Stock</label>
            <input id="stock" formControlName="stock" type="number" min="0" placeholder="0" />
          </div>

          <div class="field">
            <label for="categoria">Categoría</label>
            <select id="categoria" formControlName="categoria_id">
              <option [ngValue]="null">Sin categoría</option>
              <option *ngFor="let cat of categorias" [ngValue]="cat.id">{{ cat.nombre }}</option>
            </select>
          </div>

          <div class="field full">
            <label for="descripcion">Descripción</label>
            <textarea id="descripcion" formControlName="descripcion" rows="3" placeholder="Descripción del producto"></textarea>
          </div>

          <div class="field full">
            <label>Imagen</label>
            <app-upload-image (archivoSeleccionado)="onArchivoSeleccionado($event)" />
            <img *ngIf="imagenUrl" [src]="imagenUrl" alt="" class="img-preview" />
          </div>
        </div>

        <div *ngIf="errorMsg" class="msg-error">{{ errorMsg }}</div>

        <div class="form-acts">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || enviando">
            <div *ngIf="enviando" class="spin-sm"></div>
            <span>{{ enviando ? 'Guardando...' : (editMode ? 'Actualizar Producto' : 'Guardar Producto') }}</span>
          </button>
        </div>
      </form>

      <div *ngIf="exito" class="card-exito">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h2>{{ editMode ? 'Producto actualizado' : 'Producto creado' }} exitosamente</h2>
        <div class="exito-acts">
          <a routerLink="/admin/productos" class="btn-outline">Volver a productos</a>
          <a routerLink="/admin/productos/nuevo" class="btn-primary" *ngIf="!editMode">Agregar otro</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 680px; }
    .page-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    .page-head h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.2rem; }
    .page-desc { color: var(--text-secondary); font-size: 0.9rem; }
    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.9rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
      border: 1px solid var(--border);
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-back:hover { color: var(--text); border-color: var(--text-secondary); }
    .load-state {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 3rem;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .spinner, .spin-sm {
      width: 18px; height: 18px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    .spin-sm { border-color: rgba(255,255,255,0.3); border-top-color: #fff; width: 16px; height: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .p-form {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.75rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.15rem;
    }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field.full { grid-column: 1 / -1; }
    .field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .field input,
    .field textarea,
    .field select {
      padding: 0.6rem 0.8rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-family: inherit;
      background: var(--bg);
      color: var(--text);
      transition: border-color 0.2s;
      outline: none;
    }
    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      border-color: var(--primary);
    }
    .field input::placeholder,
    .field textarea::placeholder {
      color: var(--text-secondary);
      opacity: 0.5;
    }
    .field textarea { resize: vertical; }
    .img-preview {
      max-width: 180px;
      max-height: 110px;
      border-radius: var(--radius-sm);
      margin-top: 0.5rem;
      border: 1px solid var(--border);
    }
    .msg-error {
      margin-top: 1rem;
      padding: 0.7rem 1rem;
      background: rgba(255, 107, 107, 0.08);
      color: var(--secondary);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .form-acts {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }
    .btn-primary {
      padding: 0.65rem 1.75rem;
      background: var(--gradient);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .card-exito {
      text-align: center;
      padding: 3rem 2rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .card-exito h2 {
      margin: 1rem 0 1.5rem;
      font-size: 1.2rem;
      font-weight: 700;
    }
    .exito-acts {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      align-items: center;
    }
    .btn-outline {
      padding: 0.65rem 1.5rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text-secondary);
      border: 1.5px solid var(--border);
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-outline:hover { color: var(--text); border-color: var(--text-secondary); }

    @media (max-width: 767px) {
      .page { max-width: 100%; }
      .page-head { flex-direction: column; gap: 0.75rem; }
      .page-head h1 { font-size: 1.2rem; }
      .p-form { padding: 1rem; }
      .form-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .field.full { grid-column: 1; }
      .form-acts { justify-content: stretch; }
      .form-acts .btn-primary { width: 100%; justify-content: center; }
      .card-exito { padding: 2rem 1rem; }
      .exito-acts { flex-direction: column; gap: 0.5rem; }
      .exito-acts .btn-primary,
      .exito-acts .btn-outline { width: 100%; text-align: center; justify-content: center; }
    }
  `],
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    precio: ['', [Validators.required, Validators.min(0.01)]],
    stock: ['', [Validators.required, Validators.min(0)]],
    categoria_id: [null as number | null],
  });

  categorias: Categoria[] = [];
  editMode = false;
  productoId: number | null = null;
  loading = false;
  enviando = false;
  exito = false;
  errorMsg = '';
  imagenUrl = '';
  archivoSeleccionado: File | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.productoId = Number(idParam);
      this.cargarProducto();
    }
    this.cargarCategorias();
  }

  private cargarProducto(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/api/productos/${this.productoId}`).subscribe({
      next: (p) => {
        this.form.patchValue({
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: String(p.precio),
          stock: String(p.stock),
          categoria_id: p.categoria_id,
        });
        this.imagenUrl = p.imagen_url || '';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Error al cargar el producto';
      },
    });
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/api/categorias`).subscribe({
      next: (data) => (this.categorias = data),
    });
  }

  onArchivoSeleccionado(file: File): void {
    this.archivoSeleccionado = file;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.enviando) return;

    this.enviando = true;
    this.errorMsg = '';

    let imagenPath: string | null = null;

    try {
      if (this.archivoSeleccionado) {
        const subida = await this.storageService.subirImagen(this.archivoSeleccionado);
        this.imagenUrl = subida.url;
        imagenPath = subida.path;
        this.archivoSeleccionado = null;
      }

      const token = this.authService.sessionToken();
      const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

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

      const request$ = this.editMode
        ? this.http.put(`${environment.apiUrl}/api/productos/${this.productoId}`, body, { headers })
        : this.http.post(`${environment.apiUrl}/api/productos`, body, { headers });

      return new Promise((resolve) => {
        request$.subscribe({
          next: () => {
            this.enviando = false;
            this.exito = true;
            resolve();
          },
          error: (err) => {
            this.enviando = false;
            this.errorMsg = err.error?.detail || 'Error al guardar el producto';
            if (imagenPath) {
              this.storageService.eliminarImagen(imagenPath);
              this.imagenUrl = '';
            }
            resolve();
          },
        });
      });
    } catch (err: any) {
      this.enviando = false;
      this.errorMsg = err?.message || 'Error al subir la imagen';
    }
  }
}
