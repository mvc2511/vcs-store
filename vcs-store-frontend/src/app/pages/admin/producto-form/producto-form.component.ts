import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UploadImageComponent } from '../../../shared/components/upload-image/upload-image.component';
import { StorageService } from '../../../shared/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';
import { Variante } from '../../../shared/models/product.model';

interface Categoria { id: number; nombre: string; }
interface Talla { id: number; nombre: string; }
interface Color { id: number; nombre: string; hex: string | null; }

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgIf, NgFor, CurrencyPipe, RouterLink, UploadImageComponent],
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss',
})
export class ProductoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    precio: ['', [Validators.required, Validators.min(0.01)]],
    stock: ['', [Validators.required, Validators.min(0)]],
    categoria_id: [null as number | null],
  });

  categorias: Categoria[] = [];
  tallas: Talla[] = [];
  colores: Color[] = [];
  editMode = false;
  productoId: number | null = null;
  loading = false;
  enviando = false;
  exito = false;
  errorMsg = '';
  imagenUrl = '';
  archivoSeleccionado: File | null = null;

  // Variant state
  variantes: Variante[] = [];
  showAddVariant = false;
  nuevaTallaId: number | null = null;
  nuevoColorId: number | null = null;
  nuevoStock = 0;
  nuevoPrecioAdic = 0;
  showGenerador = false;
  genTallas = '';
  genColores = '';
  genStockDefault = 0;
  genPrecioDefault = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.productoId = Number(idParam);
      this.cargarProducto();
    }
    this.cargarCategorias();
    this.cargarTallas();
    this.cargarColores();
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
        if (p.variantes?.length) {
          this.variantes = p.variantes;
        }
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

  private cargarTallas(): void {
    this.http.get<Talla[]>(`${environment.apiUrl}/api/tallas`).subscribe({
      next: (data) => (this.tallas = data),
    });
  }

  private cargarColores(): void {
    this.http.get<Color[]>(`${environment.apiUrl}/api/colores`).subscribe({
      next: (data) => (this.colores = data),
    });
  }

  onArchivoSeleccionado(file: File): void {
    this.archivoSeleccionado = file;
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  tallaNombre(tallaId: number | null | undefined): string {
    if (!tallaId) return '—';
    return this.tallas.find(t => t.id === tallaId)?.nombre || '—';
  }

  colorNombre(colorId: number | null | undefined): string {
    if (!colorId) return '—';
    return this.colores.find(c => c.id === colorId)?.nombre || '—';
  }

  getColorHex(colorId: number | null | undefined): string {
    if (!colorId) return '#ccc';
    return this.colores.find(c => c.id === colorId)?.hex || '#ccc';
  }

  // Variant methods
  async agregarVariante(): Promise<void> {
    if (!this.productoId || (!this.nuevaTallaId && !this.nuevoColorId)) return;
    try {
      const body: Record<string, unknown> = { producto_id: this.productoId, stock: this.nuevoStock, precio_adicional: this.nuevoPrecioAdic };
      if (this.nuevaTallaId) {
        const talla = this.tallas.find(t => t.id === this.nuevaTallaId);
        body['talla'] = talla?.nombre;
        body['talla_id'] = this.nuevaTallaId;
      }
      if (this.nuevoColorId) {
        const color = this.colores.find(c => c.id === this.nuevoColorId);
        body['color'] = color?.nombre;
        body['color_id'] = this.nuevoColorId;
      }
      const resp = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/variantes`, body, { headers: this.getHeaders() })
      );
      this.variantes = [...this.variantes, resp as Variante];
      this.nuevaTallaId = null;
      this.nuevoColorId = null;
      this.nuevoStock = 0;
      this.nuevoPrecioAdic = 0;
      this.showAddVariant = false;
    } catch (err: any) {
      this.errorMsg = err.error?.detail || 'Error al crear variante';
    }
  }

  async eliminarVariante(varianteId: number): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${environment.apiUrl}/api/variantes/${varianteId}`, { headers: this.getHeaders() }));
      this.variantes = this.variantes.filter(v => v.id !== varianteId);
    } catch { this.errorMsg = 'Error al eliminar variante'; }
  }

  async generarVariantes(): Promise<void> {
    if (!this.productoId || !this.genTallas.trim() || !this.genColores.trim()) return;
    try {
      const tallas = this.genTallas.split(',').map(s => s.trim()).filter(Boolean);
      const colores = this.genColores.split(',').map(s => s.trim()).filter(Boolean);
      const resp = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/variantes/generate`, {
          producto_id: this.productoId, tallas, colores,
          stock_default: this.genStockDefault, precio_adicional_default: this.genPrecioDefault,
        }, { headers: this.getHeaders() })
      );
      this.variantes = [...this.variantes, ...(resp as Variante[])];
      this.showGenerador = false;
      this.genTallas = '';
      this.genColores = '';
    } catch (err: any) {
      this.errorMsg = err.error?.detail || 'Error al generar variantes';
    }
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

      const headers = this.getHeaders();
      const body: Record<string, unknown> = {
        nombre: this.form.value.nombre,
        descripcion: this.form.value.descripcion,
        precio: parseFloat(this.form.value.precio ?? '0'),
        stock: parseInt(this.form.value.stock ?? '0', 10),
        imagen_url: this.imagenUrl,
      };
      if (this.form.value.categoria_id) body['categoria_id'] = this.form.value.categoria_id;

      const request$ = this.editMode
        ? this.http.put(`${environment.apiUrl}/api/productos/${this.productoId}`, body, { headers })
        : this.http.post(`${environment.apiUrl}/api/productos`, body, { headers });

      return new Promise((resolve) => {
        request$.subscribe({
          next: (res: any) => {
            this.enviando = false;
            if (!this.editMode && res?.id) { this.router.navigate(['/admin/productos', res.id, 'editar']); return; }
            this.exito = true; resolve();
          },
          error: (err) => {
            this.enviando = false;
            this.errorMsg = err.error?.detail || 'Error al guardar el producto';
            if (imagenPath) { this.storageService.eliminarImagen(imagenPath); this.imagenUrl = ''; }
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
