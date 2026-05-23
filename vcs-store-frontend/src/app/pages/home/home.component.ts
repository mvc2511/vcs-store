import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../shared/services/product.service';
import { Producto } from '../../shared/models/product.model';
import { environment } from '../../../environments/environments';

interface Categoria { id: number; nombre: string; }

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf, NgFor, ProductCardComponent, CurrencyPipe, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  productos: Producto[] = [];
  categorias: Categoria[] = [];
  selectedCategoria = '';
  selectedCategoriaId: number | null = null;
  searchQuery = '';
  sortOrder = '';
  loading = true;
  loadingMore = false;
  total = 0;
  limit = 20;
  offset = 0;
  hasMore = false;

  encargoProductos: Producto[] = [];
  encargoLoading = true;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const q = params['q'];
      if (q) { this.searchQuery = q; }
      this.cargarProductos(true);
    });
    this.cargarCategorias();
    this.cargarEncargo();
  }

  private cargarCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/api/categorias`).subscribe({
      next: (data) => (this.categorias = data),
    });
  }

  cargarProductos(reset: boolean = false): void {
    if (reset) {
      this.offset = 0;
      this.productos = [];
      this.loading = true;
    }

    this.productService.getProducts({
      search: this.searchQuery || undefined,
      categoria_id: this.selectedCategoriaId ?? undefined,
      sort_by: 'precio',
      sort_order: this.sortOrder === 'price-asc' ? 'asc' : this.sortOrder === 'price-desc' ? 'desc' : undefined,
      limit: this.limit,
      offset: this.offset,
    }).subscribe({
      next: (resp) => {
        if (reset) {
          this.productos = resp.data;
        } else {
          this.productos = [...this.productos, ...resp.data];
        }
        this.total = resp.total;
        this.offset = reset ? this.limit : this.offset + resp.data.length;
        this.hasMore = this.offset < this.total;
        this.loading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
      },
    });
  }

  filterBy(categoria: Categoria): void {
    if (this.selectedCategoria === categoria.nombre) {
      this.selectedCategoria = '';
      this.selectedCategoriaId = null;
    } else {
      this.selectedCategoria = categoria.nombre;
      this.selectedCategoriaId = categoria.id;
    }
    this.cargarProductos(true);
  }

  onSearchChange(): void {
    this.cargarProductos(true);
  }

  onSortChange(): void {
    this.cargarProductos(true);
  }

  private cargarEncargo(): void {
    this.encargoLoading = true;
    this.productService.getProducts({
      por_encargo: true,
      limit: 20,
      offset: 0,
    }).subscribe({
      next: (resp) => {
        this.encargoProductos = resp.data;
        this.encargoLoading = false;
      },
      error: () => {
        this.encargoLoading = false;
      },
    });
  }

  get whatsappEncargoLink(): string {
    const msg = encodeURIComponent('Hola, quiero información sobre perfumes por encargo.');
    return `https://wa.me/525522988741?text=${msg}`;
  }

  loadMore(): void {
    this.loadingMore = true;
    this.cargarProductos(false);
  }
}
