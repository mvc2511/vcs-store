import { Component, inject, OnInit } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../shared/services/supabase.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { Producto } from '../../shared/models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf, NgFor, ProductCardComponent, CurrencyPipe, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private supabase = inject(SupabaseService);
  productos: Producto[] = [];
  categorias: string[] = [];
  selectedCategoria = '';
  searchQuery = '';
  sortOrder = '';
  loading = true;

  ngOnInit(): void {
    this.supabase.getProducts().subscribe({
      next: (data) => {
        this.productos = data;
        this.categorias = [...new Set(data.map((p) => p.categoria))];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filteredProductos(): Producto[] {
    let result = [...this.productos];
    if (this.selectedCategoria) {
      result = result.filter((p) => p.categoria === this.selectedCategoria);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q)
      );
    }
    if (this.sortOrder === 'price-asc') {
      result.sort((a, b) => a.precio - b.precio);
    } else if (this.sortOrder === 'price-desc') {
      result.sort((a, b) => b.precio - a.precio);
    }
    return result;
  }

  filterBy(categoria: string): void {
    this.selectedCategoria =
      this.selectedCategoria === categoria ? '' : categoria;
  }
}
