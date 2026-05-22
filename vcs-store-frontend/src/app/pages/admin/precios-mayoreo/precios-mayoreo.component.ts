import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface PrecioMayoreo {
  id: number;
  producto_id: number | null;
  categoria_id: number | null;
  cantidad_minima: number;
  precio_unitario: number;
  producto?: { nombre: string } | null;
  categoria?: { nombre: string } | null;
}

interface ProductoBasic { id: number; nombre: string; }
interface CategoriaBasic { id: number; nombre: string; }

@Component({
  selector: 'app-precios-mayoreo',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, CurrencyPipe],
  templateUrl: './precios-mayoreo.component.html',
  styleUrl: './precios-mayoreo.component.scss',
})
export class PreciosMayoreoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({
    tipo: ['producto' as 'producto' | 'categoria'],
    producto_id: [null as number | null],
    categoria_id: [null as number | null],
    cantidad_minima: [0, [Validators.required, Validators.min(1)]],
    precio_unitario: [0, [Validators.required, Validators.min(0.01)]],
  });

  precios: PrecioMayoreo[] = [];
  productos: ProductoBasic[] = [];
  categorias: CategoriaBasic[] = [];
  creando = false;
  editandoId: number | null = null;
  editForm = this.fb.group({
    tipo: ['producto' as 'producto' | 'categoria'],
    producto_id: [null as number | null],
    categoria_id: [null as number | null],
    cantidad_minima: [0, [Validators.required, Validators.min(1)]],
    precio_unitario: [0, [Validators.required, Validators.min(0.01)]],
  });
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargarPrecios();
    this.cargarProductos();
    this.cargarCategorias();
  }

  private cargarPrecios(): void {
    this.http.get<PrecioMayoreo[]>(`${environment.apiUrl}/api/precios-mayoreo`, { headers: this.tokenHeaders() }).subscribe({
      next: (data) => (this.precios = data),
      error: () => {},
    });
  }

  private cargarProductos(): void {
    this.http.get<{ data: ProductoBasic[] }>(`${environment.apiUrl}/api/productos`).subscribe({
      next: (resp) => (this.productos = resp.data),
      error: () => {},
    });
  }

  private cargarCategorias(): void {
    this.http.get<CategoriaBasic[]>(`${environment.apiUrl}/api/categorias`).subscribe({
      next: (data) => (this.categorias = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crearPrecio(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    const body: Record<string, any> = {
      cantidad_minima: this.form.value.cantidad_minima,
      precio_unitario: this.form.value.precio_unitario,
    };
    if (this.form.value.tipo === 'producto' && this.form.value.producto_id) {
      body['producto_id'] = this.form.value.producto_id;
    } else if (this.form.value.tipo === 'categoria' && this.form.value.categoria_id) {
      body['categoria_id'] = this.form.value.categoria_id;
    }

    this.http.post(`${environment.apiUrl}/api/precios-mayoreo`, body, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset({ tipo: 'producto', producto_id: null, categoria_id: null, cantidad_minima: 0, precio_unitario: 0 });
        this.creando = false;
        this.cargarPrecios();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear precio mayoreo';
      },
    });
  }

  iniciarEdit(p: PrecioMayoreo): void {
    this.editandoId = p.id;
    this.editForm.patchValue({
      tipo: p.producto_id ? 'producto' : 'categoria',
      producto_id: p.producto_id,
      categoria_id: p.categoria_id,
      cantidad_minima: p.cantidad_minima,
      precio_unitario: p.precio_unitario,
    });
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number): void {
    if (this.editForm.invalid) return;
    const body: Record<string, any> = {
      cantidad_minima: this.editForm.value.cantidad_minima,
      precio_unitario: this.editForm.value.precio_unitario,
    };
    if (this.editForm.value.tipo === 'producto' && this.editForm.value.producto_id) {
      body['producto_id'] = this.editForm.value.producto_id;
    } else if (this.editForm.value.tipo === 'categoria' && this.editForm.value.categoria_id) {
      body['categoria_id'] = this.editForm.value.categoria_id;
    }

    this.http.put(`${environment.apiUrl}/api/precios-mayoreo/${id}`, body, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.editandoId = null; this.cargarPrecios(); },
      error: (err) => { this.errorMsg = err.error?.detail || 'Error al actualizar precio mayoreo'; this.cancelarEdit(); },
    });
  }

  eliminarPrecio(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/precios-mayoreo/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.eliminandoId = null; this.cargarPrecios(); },
      error: () => { this.eliminandoId = null; this.errorMsg = 'Error al eliminar precio mayoreo'; },
    });
  }

  getTargetName(p: PrecioMayoreo): string {
    if (p.producto) return p.producto.nombre;
    if (p.categoria) return p.categoria.nombre;
    return '—';
  }

  getTargetType(p: PrecioMayoreo): string {
    return p.producto_id ? 'Producto' : 'Categoría';
  }
}
