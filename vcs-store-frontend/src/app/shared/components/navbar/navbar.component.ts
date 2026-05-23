import { Component, inject, OnInit, signal, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  cartService = inject(CartService);
  authService = inject(AuthService);
  router = inject(Router);
  private el = inject(ElementRef);

  menuOpen = signal(false);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.authService.cargarPerfil();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      const hamburger = this.el.nativeElement.querySelector('.hamburger');
      if (hamburger) {
        hamburger.focus();
      }
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
