import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.cargarPerfil();
    }
  }
}
