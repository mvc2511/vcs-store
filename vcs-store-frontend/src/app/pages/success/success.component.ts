import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface DetalleOrden {
  cantidad: number;
  precio_unitario: number;
  productos: { nombre: string } | null;
}

interface OrdenData {
  id: number;
  total: number;
  estado: string;
  telefono_contacto: string;
  fecha_entrega: string;
  hora_entrega: string;
  puntos_entrega: { nombre: string } | null;
  detalles_orden: DetalleOrden[];
}

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './success.component.html',
  styleUrl: './success.component.scss',
})
export class SuccessComponent implements OnInit {
  orden: OrdenData | null = null;

  ngOnInit(): void {
    const stored = sessionStorage.getItem('ultimaOrden');
    if (stored) {
      this.orden = JSON.parse(stored);
      sessionStorage.removeItem('ultimaOrden');
    }
  }
}
