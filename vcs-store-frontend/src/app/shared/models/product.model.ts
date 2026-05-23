export interface Variante {
  id: number;
  producto_id: number;
  nombre_variante?: string | null;
  tipo_variante?: string | null;
  color?: string | null;
  talla_id?: number | null;
  color_id?: number | null;
  stock: number;
  precio_adicional: number;
  imagen_url?: string | null;
}

export interface OpcionMl {
  id: number;
  categoria_id: number;
  ml: number;
  orden: number;
  categorias?: { nombre: string };
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  categoria_id?: number;
  stock: number;
  stock_real?: number;
  has_variants?: boolean;
  visible?: boolean;
  es_encargo?: boolean;
  dias_entrega?: number;
  imagen_url: string;
  descripcion: string;
  variantes?: Variante[];
}

export interface CarritoItem {
  producto: Producto;
  variante?: Variante | null;
  cantidad: number;
}

export interface Resena {
  id: number;
  producto_id: number;
  user_id: string;
  puntuacion: number;
  comentario?: string | null;
  anonima: boolean;
  created_at: string;
  nombre?: string;
}
