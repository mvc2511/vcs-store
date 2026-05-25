import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  visible?: boolean;
  genero?: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, CurrencyPipe, FormsModule],
  templateUrl: './admin-productos.component.html',
  styleUrl: './admin-productos.component.scss',
})
export class AdminProductosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  loading = true;
  errorMsg = '';
  confirmarEliminar: Producto | null = null;
  eliminandoId: number | null = null;

  searchQuery = '';
  selectedGenero = '';
  selectedCategoria = '';
  generoOptions = ['hombre', 'mujer', 'unisex'];

  get filteredProductos(): Producto[] {
    let list = this.productos;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    if (this.selectedGenero) {
      list = list.filter((p) => p.genero === this.selectedGenero);
    }

    if (this.selectedCategoria) {
      list = list.filter((p) => p.categorias?.nombre === this.selectedCategoria);
    }

    return list;
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  private cargarProductos(): void {
    this.loading = true;
    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    this.http.get<{ data: Producto[] }>(`${environment.apiUrl}/api/admin/productos`, { headers }).subscribe({
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

  private cargarCategorias(): void {
    const headers = new HttpHeaders({});
    this.http.get<Categoria[]>(`${environment.apiUrl}/api/categorias?con_productos=true`).subscribe({
      next: (data) => {
        this.categorias = data;
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
