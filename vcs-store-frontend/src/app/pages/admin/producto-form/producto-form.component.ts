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
  templateUrl: './producto-form.component.html',
  styleUrl: './producto-form.component.scss',
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
