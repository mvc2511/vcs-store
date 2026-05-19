import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string;
  categoria_id: number | null;
  categorias: { nombre: string } | null;
}

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, CurrencyPipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1>Productos</h1>
          <p class="page-desc">Gestioná el catálogo de tu tienda.</p>
        </div>
        <a routerLink="/admin/productos/nuevo" class="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span class="btn-label">Nuevo Producto</span>
        </a>
      </div>

      <div *ngIf="loading" class="load-state">
        <div class="spinner"></div>
        <span>Cargando productos...</span>
      </div>

      <div *ngIf="errorMsg" class="msg-error">{{ errorMsg }}</div>

      <div class="table-wrap" *ngIf="!loading && productos.length > 0">
        <table class="data-table" *ngIf="productos.length > 0">
          <thead>
            <tr>
              <th class="col-img"></th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th class="col-acts"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of productos">
              <td class="col-img" data-label="">
                <div class="thumb" *ngIf="p.imagen_url; else noImg">
                  <img [src]="p.imagen_url" [alt]="p.nombre" loading="lazy" />
                </div>
                <ng-template #noImg>
                  <div class="thumb thumb-empty">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                </ng-template>
              </td>
              <td class="col-name" data-label="Nombre">
                <span class="pname">{{ p.nombre }}</span>
              </td>
              <td class="col-price" data-label="Precio">{{ p.precio | currency:'ARS':'symbol-narrow':'1.2-2' }}</td>
              <td class="col-stock" data-label="Stock">
                <span class="stock" [class.low]="p.stock < 5">{{ p.stock }}</span>
              </td>
              <td class="col-cat" data-label="Categoría">{{ p.categorias?.nombre || '—' }}</td>
              <td class="col-acts" data-label="">
                <div class="row-acts">
                  <a [routerLink]="['/admin/productos', p.id, 'editar']" class="act-btn" title="Editar">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </a>
                  <button class="act-btn danger" title="Eliminar" (click)="eliminar(p)" [disabled]="eliminandoId === p.id">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!loading && productos.length === 0" class="empty-state">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h3>No hay productos</h3>
        <p>Agregá tu primer producto al catálogo.</p>
        <a routerLink="/admin/productos/nuevo" class="btn-primary">Agregar Producto</a>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="confirmarEliminar" (click)="cerrarModal()">
      <div class="modal-card" (click)="$event.stopPropagation()" role="alertdialog" aria-label="Confirmar eliminación">
        <h3>¿Eliminar producto?</h3>
        <p>Esta acción no se puede deshacer.</p>
        <div class="modal-acts">
          <button class="btn-sec" (click)="cerrarModal()">Cancelar</button>
          <button class="btn-danger" (click)="confirmarDelete()" [disabled]="eliminandoId !== null">
            {{ eliminandoId ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    .page-head h1 { font-size: 1.5rem; font-weight: 700; }
    .page-desc { color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.15rem; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.6rem 1.15rem;
      background: var(--gradient);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.85rem;
      text-decoration: none;
      white-space: nowrap;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .btn-primary:hover { opacity: 0.9; }
    .load-state {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 3rem;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .msg-error {
      margin-bottom: 1rem;
      padding: 0.7rem 1rem;
      background: rgba(255, 107, 107, 0.08);
      color: var(--secondary);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .table-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      text-align: left;
      padding: 0.8rem 1rem;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border);
    }
    .data-table td {
      padding: 0.7rem 1rem;
      font-size: 0.88rem;
      color: var(--text);
      border-bottom: 1px solid var(--border);
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8f8fc; }
    .col-img { width: 48px; }
    .col-price { font-variant-numeric: tabular-nums; }
    .col-acts { width: 80px; text-align: right; }
    .thumb {
      width: 34px; height: 34px;
      border-radius: 6px;
      overflow: hidden;
      background: var(--bg);
    }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .thumb-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      opacity: 0.4;
    }
    .pname { font-weight: 600; }
    .stock {
      display: inline-block;
      padding: 0.1rem 0.45rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      background: rgba(16, 185, 129, 0.08);
      color: #059669;
    }
    .stock.low { background: rgba(255, 107, 107, 0.08); color: var(--secondary); }
    .row-acts { display: flex; gap: 0.15rem; justify-content: flex-end; }
    .act-btn {
      width: 30px; height: 30px;
      border: none; border-radius: 6px;
      display: inline-flex;
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
      padding: 3rem 2rem;
      text-align: center;
      color: var(--text-secondary);
    }
    .empty-state svg { margin-bottom: 0.75rem; opacity: 0.4; }
    .empty-state h3 { color: var(--text); font-size: 1.05rem; margin-bottom: 0.4rem; }
    .empty-state p { font-size: 0.88rem; margin-bottom: 1.25rem; }
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 1.75rem;
      max-width: 360px;
      width: calc(100% - 2rem);
      box-shadow: var(--shadow-lg);
      margin: 1rem;
    }
    .modal-card h3 { font-size: 1.05rem; margin-bottom: 0.35rem; }
    .modal-card p { color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.25rem; }
    .modal-acts { display: flex; gap: 0.65rem; justify-content: flex-end; }
    .btn-sec {
      padding: 0.55rem 1.15rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-secondary);
      background: var(--bg);
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-sec:hover { color: var(--text); border-color: var(--text-secondary); }
    .btn-danger {
      padding: 0.55rem 1.15rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.85rem;
      background: var(--secondary);
      color: #fff;
      border: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-danger:hover:not(:disabled) { opacity: 0.9; }

    @media (max-width: 767px) {
      .page-head { flex-direction: column; gap: 0.75rem; }
      .page-head h1 { font-size: 1.25rem; }
      .btn-label { display: none; }
      .btn-primary {
        padding: 0.6rem;
        width: 40px;
        height: 40px;
        justify-content: center;
        border-radius: 50%;
        position: fixed;
        bottom: 4.5rem;
        right: 1rem;
        z-index: 999;
        box-shadow: var(--shadow-lg);
      }

      .data-table, .data-table thead, .data-table tbody,
      .data-table th, .data-table td, .data-table tr {
        display: block;
      }
      .data-table thead { display: none; }
      .table-wrap { border: none; border-radius: 0; background: transparent; }
      .data-table tr {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        margin-bottom: 0.75rem;
        padding: 1rem;
        position: relative;
      }
      .data-table tr:hover td { background: transparent; }
      .data-table td {
        padding: 0.3rem 0 0.3rem 40%;
        border: none;
        font-size: 0.85rem;
        position: relative;
        min-height: 1.5rem;
      }
      .data-table td::before {
        content: attr(data-label);
        position: absolute;
        left: 0;
        top: 0.3rem;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-secondary);
        width: 38%;
      }
      .col-img {
        padding-left: 0 !important;
        margin-bottom: 0.5rem;
      }
      .col-img::before { display: none; }
      .thumb, .thumb-empty {
        width: 48px;
        height: 48px;
      }
      .col-acts { padding-left: 0 !important; }
      .col-acts::before { display: none; }
      .row-acts { justify-content: flex-start; }
      .col-price { font-size: 1rem; font-weight: 600; color: var(--primary); }
      .modal-card { margin: 1rem; width: calc(100% - 2rem); }
    }
  `],
})
export class AdminProductosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  productos: Producto[] = [];
  loading = true;
  errorMsg = '';
  confirmarEliminar: Producto | null = null;
  eliminandoId: number | null = null;

  ngOnInit(): void {
    this.cargarProductos();
  }

  private cargarProductos(): void {
    this.loading = true;
    this.http.get<Producto[]>(`${environment.apiUrl}/api/productos`).subscribe({
      next: (data) => {
        this.productos = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Error al cargar productos';
      },
    });
  }

  eliminar(p: Producto): void {
    this.confirmarEliminar = p;
  }

  cerrarModal(): void {
    this.confirmarEliminar = null;
  }

  confirmarDelete(): void {
    if (!this.confirmarEliminar) return;
    const id = this.confirmarEliminar.id;
    this.eliminandoId = id;

    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

    this.http.delete(`${environment.apiUrl}/api/productos/${id}`, { headers }).subscribe({
      next: () => {
        this.productos = this.productos.filter((p) => p.id !== id);
        this.confirmarEliminar = null;
        this.eliminandoId = null;
      },
      error: () => {
        this.eliminandoId = null;
        this.errorMsg = 'Error al eliminar producto';
      },
    });
  }
}
