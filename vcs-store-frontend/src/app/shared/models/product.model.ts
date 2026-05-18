export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  imagen_url: string;
  descripcion: string;
}

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
}
