import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Producto } from '../models/product.model';
import { from, Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

interface ProductoFromDB {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url: string;
  descripcion: string;
  categorias: { nombre: string };
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  private mapProducto(raw: ProductoFromDB): Producto {
    return {
      id: raw.id,
      nombre: raw.nombre,
      precio: raw.precio,
      stock: raw.stock,
      imagen_url: raw.imagen_url,
      descripcion: raw.descripcion,
      categoria: raw.categorias.nombre,
    };
  }

  getProducts(): Observable<Producto[]> {
    return from(
      this.supabase
        .from('productos')
        .select('id, nombre, precio, stock, imagen_url, descripcion, categorias!inner(nombre)')
        .order('id', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return (data as unknown as ProductoFromDB[]).map((p) =>
            this.mapProducto(p)
          );
        })
    );
  }

  getProductsByCategory(category: string): Observable<Producto[]> {
    return from(
      this.supabase
        .from('productos')
        .select('id, nombre, precio, stock, imagen_url, descripcion, categorias!inner(nombre)')
        .eq('categorias.nombre', category)
        .order('id', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error;
          return (data as unknown as ProductoFromDB[]).map((p) =>
            this.mapProducto(p)
          );
        })
    );
  }

  getProductById(id: number): Observable<Producto | null> {
    return from(
      this.supabase
        .from('productos')
        .select('id, nombre, precio, stock, imagen_url, descripcion, categorias!inner(nombre)')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data
            ? this.mapProducto(data as unknown as ProductoFromDB)
            : null;
        })
    );
  }
}
