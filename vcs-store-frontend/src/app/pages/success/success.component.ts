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

  ngOnInit(): void {
    this.cartService.clearCart();
    this.route.queryParams.subscribe((params) => {
      this.esCOD = params['tipo'] === 'cod';
    });
  }
}
