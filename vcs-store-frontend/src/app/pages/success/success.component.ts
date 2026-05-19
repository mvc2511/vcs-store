import { Component, inject, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CartService } from '../../shared/services/cart.service';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './success.component.html',
  styleUrl: './success.component.css',
})
export class SuccessComponent implements OnInit {
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  esCOD = false;
  puntoEntregaNombre = '';

  private readonly PUNTOS_MAP: Record<number, string> = {
    1: 'Crucero de Dongu',
    2: 'Deportivo Dongu',
    3: 'Centro San Felipe',
    4: 'Crucero de San Juan',
    5: 'Centro de San Juan',
    6: 'Pickup en local de San Antonio',
  };

  ngOnInit(): void {
    this.cartService.clearCart();
    this.route.queryParams.subscribe((params) => {
      this.esCOD = params['tipo'] === 'cod';
      if (this.esCOD && params['punto']) {
        const id = parseInt(params['punto'], 10);
        this.puntoEntregaNombre = this.PUNTOS_MAP[id] || '';
      }
    });
  }
}
