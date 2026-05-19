import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SeoService } from './core/services/seo.service';
import { CartMergeModalComponent } from './shared/components/cart-merge-modal/cart-merge-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CartMergeModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = this.router.url;
        if (url === '/') {
          this.seo.reset();
        } else if (url.startsWith('/producto/')) {
        } else if (url === '/cart') {
          this.seo.update({
            title: 'Carrito de Compras',
            description: 'Revisa tu carrito de compras en VC\'S Store. Moda urbana con envíos a todo México.',
            ogUrl: `https://vcsstore.com${url}`,
            canonicalUrl: `https://vcsstore.com${url}`,
          });
        } else if (url === '/login') {
          this.seo.update({
            title: 'Iniciar Sesión',
            description: 'Accede a tu cuenta en VC\'S Store para gestionar tus pedidos y favoritos.',
            ogUrl: `https://vcsstore.com${url}`,
            canonicalUrl: `https://vcsstore.com${url}`,
          });
        } else {
          this.seo.reset();
        }
      });
  }
}
