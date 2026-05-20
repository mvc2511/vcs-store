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
  templateUrl: './nuevo-producto.component.html',
  styleUrl: './nuevo-producto.component.scss',
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
