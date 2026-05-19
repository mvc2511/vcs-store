import { Component, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-merge-modal',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './cart-merge-modal.component.html',
  styleUrl: './cart-merge-modal.component.scss',
})
export class CartMergeModalComponent {
  cartService = inject(CartService);

  apply(decision: 'server' | 'local' | 'merge'): void {
    this.cartService.applyMergeDecision(decision);
  }
}
