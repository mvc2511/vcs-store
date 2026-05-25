import { Component, OnInit, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../shared/services/product.service';
import { Producto } from '../../shared/models/product.model';

@Component({
  selector: 'app-sobre-pedido',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, RouterLink, ProductCardComponent],
  templateUrl: './sobre-pedido.component.html',
  styleUrl: './sobre-pedido.component.scss',
})
export class SobrePedidoComponent implements OnInit {
  private productService = inject(ProductService);

  productos: Producto[] = [];
  loading = true;
  searchQuery = '';

  get filteredProductos(): Producto[] {
    let list = this.productos;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }
    return list;
  }

  onSearchChange(): void {}

  get whatsappLink(): string {
    const msg = encodeURIComponent('Hola, quiero información sobre perfumes sobre pedido.');
    return `https://wa.me/525522988741?text=${msg}`;
  }

  ngOnInit(): void {
    this.productService.getProducts({
      por_encargo: true,
      limit: 50,
      offset: 0,
    }).subscribe({
      next: (resp) => {
        this.productos = resp.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
