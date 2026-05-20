export interface Variante {
  id: number;
  producto_id: number;
  talla?: string | null;
  color?: string | null;
  talla_id?: number | null;
  color_id?: number | null;
  stock: number;
  precio_adicional: number;
  imagen_url?: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  imagen_url: string;
  descripcion: string;
  variantes?: Variante[];
}

export interface CarritoItem {
  producto: Producto;
  variante?: Variante | null;
  cantidad: number;
}
