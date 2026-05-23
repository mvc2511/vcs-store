import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Producto, ProductoImagen, Variante } from '../models/product.model';
import { from, Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

interface ProductoFromDB {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url: string;
  descripcion: string;
  es_encargo?: boolean;
  dias_entrega?: number;
  categorias: { nombre: string };
  producto_imagenes?: ProductoImagenFromDB[];
}

interface ProductoImagenFromDB {
  id: number;
  producto_id: number;
  url: string;
  orden: number;
  color_id: number | null;
  creado_en: string;
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

  private mapProducto(raw: ProductoFromDB, variantes?: Variante[], imagenes?: ProductoImagen[]): Producto {
    return {
      id: raw.id,
      nombre: raw.nombre,
      precio: raw.precio,
      stock: raw.stock,
      imagen_url: raw.imagen_url,
      descripcion: raw.descripcion,
      es_encargo: raw.es_encargo,
      dias_entrega: raw.dias_entrega,
      categoria: raw.categorias.nombre,
      variantes,
      imagenes,
    };
  }

  getProducts(): Observable<Producto[]> {
    return from(
      this.supabase
        .from('productos')
        .select('id, nombre, precio, stock, imagen_url, descripcion, es_encargo, dias_entrega, categorias!inner(nombre)')
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
        .select('id, nombre, precio, stock, imagen_url, descripcion, es_encargo, dias_entrega, categorias!inner(nombre)')
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
          .select('id, nombre, precio, stock, imagen_url, descripcion, es_encargo, dias_entrega, categorias!inner(nombre)')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return null;

        const raw = data as unknown as ProductoFromDB;
        const producto = this.mapProducto(raw);

        const { data: variantes } = await this.supabase
          .from('variantes_producto')
          .select('*')
          .eq('producto_id', id)
          .order('id');

        if (variantes && variantes.length > 0) {
          producto.variantes = variantes as Variante[];
        }

        const { data: imagenes } = await this.supabase
          .from('producto_imagenes')
          .select('*')
          .eq('producto_id', id)
          .order('orden');

        if (imagenes && imagenes.length > 0) {
          producto.imagenes = imagenes as ProductoImagen[];
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
