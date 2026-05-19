import { Component, inject } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-merge-modal',
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <div class="merge-overlay" *ngIf="cartService.mergePending()">
      <div class="merge-modal" role="dialog" aria-modal="true" aria-labelledby="merge-title">
        <h2 id="merge-title">Tienes productos guardados</h2>
        <p>Encontramos artículos en tu carrito local y en tu sesión anterior. ¿Qué quieres hacer?</p>

        <div class="merge-options">
          <button class="merge-option" (click)="apply('server')">
            <strong>Conservar los del servidor</strong>
            <span>Mantén los artículos que guardaste en tu sesión anterior</span>
          </button>

          <button class="merge-option" (click)="apply('local')">
            <strong>Usar los locales</strong>
            <span>Reemplaza con los artículos que tienes ahora en tu carrito</span>
          </button>

          <button class="merge-option" (click)="apply('merge')">
            <strong>Fusionar</strong>
            <span>Combinar ambos carritos. Si hay productos repetidos, se suman las cantidades</span>
          </button>
        </div>

        <div class="merge-summary">
          <div class="merge-col">
            <h3>Carrito local ({{ cartService.localCartItems().length }})</h3>
            <ul>
              <li *ngFor="let item of cartService.localCartItems()">
                {{ item.producto.nombre }} x{{ item.cantidad }}
              </li>
            </ul>
          </div>
          <div class="merge-col">
            <h3>Carrito del servidor ({{ cartService.serverCartItems().length }})</h3>
            <ul>
              <li *ngFor="let item of cartService.serverCartItems()">
                {{ item.producto.nombre }} x{{ item.cantidad }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .merge-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
    }
    .merge-modal {
      background: #fff; border-radius: 16px;
      padding: 32px; max-width: 600px; width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .merge-modal h2 { margin: 0 0 8px; font-size: 1.4rem; }
    .merge-modal p { color: #666; margin: 0 0 24px; }
    .merge-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
    .merge-option {
      display: flex; flex-direction: column; gap: 4px;
      padding: 16px; border: 2px solid #e0e0e0; border-radius: 12px;
      background: #fafafa; cursor: pointer; transition: all .2s;
      text-align: left; font-size: 0.95rem;
    }
    .merge-option:hover { border-color: #000; background: #f0f0f0; }
    .merge-option span { color: #888; font-size: 0.85rem; }
    .merge-summary { display: flex; gap: 24px; }
    .merge-col { flex: 1; }
    .merge-col h3 { font-size: 0.9rem; margin: 0 0 8px; color: #444; }
    .merge-col ul { margin: 0; padding-left: 20px; font-size: 0.85rem; color: #666; }
    .merge-col li { margin-bottom: 4px; }
  `]
})
export class CartMergeModalComponent {
  cartService = inject(CartService);

  apply(decision: 'server' | 'local' | 'merge'): void {
    this.cartService.applyMergeDecision(decision);
  }
}
