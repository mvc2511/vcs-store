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
import { Variante, OpcionMl, ProductoImagen } from '../../../shared/models/product.model';

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
    stock: ['', [Validators.min(0)]],
    categoria_id: [null as number | null],
    visible: [true],
    es_encargo: [false],
    dias_entrega: [5],
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
  nuevoNombreVariante: string = '';
  nuevoColorId: number | null = null;
  nuevoStock = 0;
  nuevoPrecioAdic = 0;
  showGenerador = false;
  genTallas = '';
  genColores = '';
  genStockDefault = 0;
  genPrecioDefault = 0;

  // Inline edit state
  editandoVarianteId: number | null = null;
  editStockValue = 0;
  editPrecioValue = 0;

  // Gallery state
  galleryImagenes: ProductoImagen[] = [];
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];
  galleryColorMap: (number | null)[] = [];

  // ML options from API
  mlOptions: number[] = [];
  mlLoading = false;

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

    // Watch category changes to load ml options
    this.form.get('categoria_id')?.valueChanges.subscribe((catId) => {
      this.cargarMlOptions(catId);
    });
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
          visible: p.visible !== false,
          es_encargo: p.es_encargo ?? false,
          dias_entrega: p.dias_entrega ?? 5,
        });
        this.imagenUrl = p.imagen_url || '';
        this.galleryImagenes = (p.imagenes || []).map((img: ProductoImagen, i: number) => ({ ...img, orden: i }));
        this.loading = false;
        if (p.variantes?.length) {
          this.variantes = p.variantes;
        }
        // Load ml options for the category
        if (p.categoria_id) {
          this.cargarMlOptions(p.categoria_id);
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

  private cargarMlOptions(categoriaId: number | null): void {
    this.mlOptions = [];
    if (!categoriaId) return;
    this.mlLoading = true;
    this.http.get<OpcionMl[]>(`${environment.apiUrl}/api/opciones-ml?categoria_id=${categoriaId}`).subscribe({
      next: (data) => {
        this.mlOptions = data.map(o => o.ml);
        this.mlLoading = false;
      },
      error: () => {
        this.mlOptions = [];
        this.mlLoading = false;
      },
    });
  }

  onArchivoSeleccionado(file: File): void {
    this.archivoSeleccionado = file;
  }

  // ── Gallery Methods ──────────────────────────

  onGalleryFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input?.files;
    if (!files?.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.galleryFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.galleryPreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);

      this.galleryColorMap.push(null);
    }

    input.value = '';
  }

  setGalleryColor(index: number, colorId: number | null): void {
    // Existing image → update immediately
    if (index < this.galleryImagenes.length) {
      this.galleryImagenes[index] = { ...this.galleryImagenes[index], color_id: colorId };
      this.http.put(
        `${environment.apiUrl}/api/productos/${this.productoId}/imagenes/${this.galleryImagenes[index].id}`,
        { color_id: colorId },
        { headers: this.getHeaders() }
      ).subscribe({
        error: () => { this.errorMsg = 'Error al actualizar el color de la imagen'; },
      });
    } else {
      // New file → store for submit
      const fi = index - this.galleryImagenes.length;
      this.galleryColorMap[fi] = colorId;
    }
  }

  moveGalleryImage(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.galleryFiles.length + this.galleryImagenes.length) return;

    const totalImages = [...this.galleryImagenes, ...this.galleryFiles.map((_, i) => ({ _fileIndex: i } as any))];

    const isNew = index >= this.galleryImagenes.length;
    const fileIndex = isNew ? index - this.galleryImagenes.length : -1;

    if (isNew) {
      // Swap in galleryFiles
      [this.galleryFiles[fileIndex], this.galleryFiles[fileIndex + direction]] =
        [this.galleryFiles[fileIndex + direction], this.galleryFiles[fileIndex]];
      [this.galleryPreviews[fileIndex], this.galleryPreviews[fileIndex + direction]] =
        [this.galleryPreviews[fileIndex + direction], this.galleryPreviews[fileIndex]];
      [this.galleryColorMap[fileIndex], this.galleryColorMap[fileIndex + direction]] =
        [this.galleryColorMap[fileIndex + direction], this.galleryColorMap[fileIndex]];
    } else {
      // Swap in galleryImagenes
      const targetIdx = index + direction;
      const isTargetNew = targetIdx >= this.galleryImagenes.length;

      if (isTargetNew) {
        // Moving an existing image to the position of a new file
        const tfi = targetIdx - this.galleryImagenes.length;
        const img = this.galleryImagenes.splice(index, 1)[0];
        this.galleryImagenes.splice(targetIdx, 0, img);
        // Update orden for the moved image
        this.galleryImagenes.forEach((im, i) => { im.orden = i; });
      } else {
        [this.galleryImagenes[index], this.galleryImagenes[targetIdx]] =
          [this.galleryImagenes[targetIdx], this.galleryImagenes[index]];
        this.galleryImagenes.forEach((im, i) => { im.orden = i; });
      }
    }
  }

  removeGalleryImage(index: number): void {
    const isExisting = index < this.galleryImagenes.length;
    if (isExisting) {
      const img = this.galleryImagenes[index];
      if (!confirm(`¿Eliminar esta imagen de la galería?`)) return;
      // Delete from storage first
      const path = img.url.split('/').pop();
      if (path) {
        this.storageService.eliminarImagen(path);
      }
      this.http.delete(`${environment.apiUrl}/api/productos/${this.productoId}/imagenes/${img.id}`, {
        headers: this.getHeaders(),
      }).subscribe({
        next: () => {
          this.galleryImagenes.splice(index, 1);
          this.galleryImagenes.forEach((im, i) => { im.orden = i; });
        },
        error: () => {
          this.errorMsg = 'Error al eliminar la imagen';
        },
      });
    } else {
      const fi = index - this.galleryImagenes.length;
      this.galleryFiles.splice(fi, 1);
      this.galleryPreviews.splice(fi, 1);
      this.galleryColorMap.splice(fi, 1);
    }
  }

  totalGalleryImages(): number {
    return this.galleryImagenes.length + this.galleryFiles.length;
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

  // ─────────────────────────────────────────────
  // Category-aware helpers (API-driven)
  // ─────────────────────────────────────────────

  get isPerfumeOrDecant(): boolean {
    return this.mlOptions.length > 0;
  }

  get showColorField(): boolean {
    return !this.isPerfumeOrDecant;
  }

  get variantLabel(): string {
    return this.isPerfumeOrDecant ? 'Mililitros' : 'Talla / Volumen';
  }

  hasMlOptions(): boolean {
    return this.mlOptions.length > 0;
  }

  // Variant methods
  async agregarVariante(): Promise<void> {
    if (!this.productoId) return;
    if (!this.nuevaTallaId && !this.nuevoNombreVariante.trim() && !this.nuevoColorId) return;
    try {
      const body: Record<string, unknown> = { producto_id: this.productoId, stock: this.nuevoStock, precio_adicional: this.nuevoPrecioAdic };
      if (this.nuevaTallaId) {
        const talla = this.tallas.find(t => t.id === this.nuevaTallaId);
        body['nombre_variante'] = talla?.nombre;
        body['talla_id'] = this.nuevaTallaId;
      } else if (this.nuevoNombreVariante?.trim()) {
        body['nombre_variante'] = this.nuevoNombreVariante.trim();
      }
      if (this.nuevoColorId) {
        const color = this.colores.find(c => c.id === this.nuevoColorId);
        body['color'] = color?.nombre;
        body['color_id'] = this.nuevoColorId;
      }
      const resp = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/variantes`, body, { headers: this.getHeaders() })
      );
      const updatedVariants = [...this.variantes, resp as Variante];
      this.variantes = updatedVariants;
      const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
      this.form.patchValue({ stock: String(totalStock) });
      this.nuevaTallaId = null;
      this.nuevoNombreVariante = '';
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
      const updatedVariants = this.variantes.filter(v => v.id !== varianteId);
      this.variantes = updatedVariants;
      const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
      this.form.patchValue({ stock: String(totalStock) });
    } catch { this.errorMsg = 'Error al eliminar variante'; }
  }

  iniciarEdicion(v: Variante): void {
    this.editandoVarianteId = v.id;
    this.editStockValue = v.stock;
    this.editPrecioValue = v.precio_adicional;
  }

  cancelarEdicion(): void {
    this.editandoVarianteId = null;
  }

  async guardarEdicion(varianteId: number): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.http.put(`${environment.apiUrl}/api/variantes/${varianteId}`, {
          stock: this.editStockValue,
          precio_adicional: this.editPrecioValue,
        }, { headers: this.getHeaders() })
      );
      this.variantes = this.variantes.map(v => v.id === varianteId ? (resp as Variante) : v);
      const totalStock = this.variantes.reduce((sum, v) => sum + v.stock, 0);
      this.form.patchValue({ stock: String(totalStock) });
      this.editandoVarianteId = null;
    } catch (err: any) {
      this.errorMsg = err.error?.detail || 'Error al guardar variante';
    }
  }

  async generarVariantes(): Promise<void> {
    if (!this.productoId || !this.genTallas.trim() || (!this.isPerfumeOrDecant && !this.genColores.trim())) return;
    try {
      const tallas = this.genTallas.split(',').map(s => s.trim()).filter(Boolean);
      const colores = this.genColores.split(',').map(s => s.trim()).filter(Boolean);
      const resp = await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/variantes/generate`, {
          producto_id: this.productoId, tallas, colores,
          stock_default: this.genStockDefault, precio_adicional_default: this.genPrecioDefault,
        }, { headers: this.getHeaders() })
      );
      const updatedVariants = [...this.variantes, ...(resp as Variante[])];
      this.variantes = updatedVariants;
      const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
      this.form.patchValue({ stock: String(totalStock) });
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
    const uploadedPaths: string[] = [];

    try {
      // Step 1: Upload main image
      if (this.archivoSeleccionado) {
        const subida = await this.storageService.subirImagen(this.archivoSeleccionado);
        this.imagenUrl = subida.url;
        imagenPath = subida.path;
        this.archivoSeleccionado = null;
      }

      const headers = this.getHeaders();
      const stockValue = this.form.value.stock;
      const body: Record<string, unknown> = {
        nombre: this.form.value.nombre,
        descripcion: this.form.value.descripcion,
        precio: parseFloat(this.form.value.precio ?? '0'),
        stock: stockValue ? parseInt(stockValue, 10) : 0,
        imagen_url: this.imagenUrl,
        visible: this.form.value.visible ?? true,
        es_encargo: !!this.form.value.es_encargo,
        dias_entrega: this.form.value.dias_entrega ?? 5,
      };
      if (this.form.value.categoria_id) body['categoria_id'] = this.form.value.categoria_id;

      const request$ = this.editMode
        ? this.http.put(`${environment.apiUrl}/api/productos/${this.productoId}`, body, { headers })
        : this.http.post(`${environment.apiUrl}/api/productos`, body, { headers });

      const res: any = await firstValueFrom(request$);
      const pid = res?.id || this.productoId;
      this.productoId = pid;

      // Step 2: Upload gallery images
      if (this.galleryFiles.length > 0) {
        const baseOrden = this.galleryImagenes.length;
        for (let i = 0; i < this.galleryFiles.length; i++) {
          const file = this.galleryFiles[i];
          const subida = await this.storageService.subirImagen(file);
          uploadedPaths.push(subida.path);

          await firstValueFrom(
            this.http.post(
              `${environment.apiUrl}/api/productos/${pid}/imagenes`,
              {
                url: subida.url,
                color_id: this.galleryColorMap[i] || null,
                orden: baseOrden + i,
              },
              { headers }
            )
          );
        }
        this.galleryFiles = [];
        this.galleryPreviews = [];
        this.galleryColorMap = [];
      }

      // Navigate on create
      if (!this.editMode) {
        this.enviando = false;
        this.router.navigate(['/admin/productos', pid, 'editar']);
        return;
      }

      this.enviando = false;
      this.exito = true;
    } catch (err: any) {
      this.enviando = false;
      this.errorMsg = err?.message || err?.error?.detail || 'Error al guardar el producto';

      // Rollback uploaded gallery images
      for (const path of uploadedPaths) {
        this.storageService.eliminarImagen(path);
      }
      if (imagenPath) {
        this.storageService.eliminarImagen(imagenPath);
        this.imagenUrl = '';
      }
    }
  }
}
