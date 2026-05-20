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
  templateUrl: './admin-productos.component.html',
  styleUrl: './admin-productos.component.scss',
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
    this.http.get<{ data: Producto[] }>(`${environment.apiUrl}/api/productos`).subscribe({
      next: (resp) => {
        this.productos = resp.data;
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
