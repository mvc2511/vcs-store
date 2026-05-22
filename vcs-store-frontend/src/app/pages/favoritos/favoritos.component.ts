import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { WishlistService } from '../../shared/services/wishlist.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, ProductCardComponent],
  templateUrl: './favoritos.component.html',
  styleUrl: './favoritos.component.scss',
})
export class FavoritosComponent {
  wishlistService = inject(WishlistService);
}
