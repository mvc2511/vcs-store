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
  stock: number;
  stock_real?: number;
  has_variants?: boolean;
  imagen_url: string;
  descripcion: string;
  variantes?: Variante[];
}

export interface CarritoItem {
  producto: Producto;
  variante?: Variante | null;
  cantidad: number;
}
