export interface ProductoImagen {
  id: number;
  producto_id: number;
  url: string;
  orden: number;
  color_id: number | null;
  creado_en: string;
}

export interface Variante {
  id: number;
  producto_id: number;
  nombre_variante?: string | null;
  tipo_variante?: string | null;
  color?: string | null;
  talla_id?: number | null;
  color_id?: number | null;
  stock: number;
  precio?: number | null;
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
  min_precio_variante?: number | null;
  visible?: boolean;
  es_encargo?: boolean;
  dias_entrega?: number;
  genero?: string | null;
  imagen_url: string;
  descripcion: string;
  variantes?: Variante[];
  imagenes?: ProductoImagen[];
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
