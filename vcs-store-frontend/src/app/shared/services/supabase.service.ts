import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Producto, Variante } from '../models/product.model';
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

  private mapProducto(raw: ProductoFromDB, variantes?: Variante[]): Producto {
    return {
      id: raw.id,
      nombre: raw.nombre,
      precio: raw.precio,
      stock: raw.stock,
      imagen_url: raw.imagen_url,
      descripcion: raw.descripcion,
      categoria: raw.categorias.nombre,
      variantes,
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
      (async () => {
        const { data, error } = await this.supabase
          .from('productos')
          .select('id, nombre, precio, stock, imagen_url, descripcion, categorias!inner(nombre)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return null;

        const producto = this.mapProducto(data as unknown as ProductoFromDB);

        const { data: variantes } = await this.supabase
          .from('variantes_producto')
          .select('*')
          .eq('producto_id', id)
          .order('id');

        if (variantes && variantes.length > 0) {
          producto.variantes = variantes as Variante[];
        }

        return producto;
      })()
    );
  }

  async getPerfil(userId: string): Promise<{ data: { nombre: string } | null }> {
    return this.supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', userId)
      .maybeSingle();
  }

  async actualizarNombre(userId: string, nombre: string): Promise<{ error: any }> {
    const { error } = await this.supabase
      .from('perfiles')
      .update({ nombre })
      .eq('id', userId);
    return { error };
  }
}
