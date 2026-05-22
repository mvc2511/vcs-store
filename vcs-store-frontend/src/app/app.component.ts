import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SeoService } from './core/services/seo.service';
import { ToastContainerComponent } from './shared/components/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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
            description: 'Accede a tu cuenta en VYRO para gestionar tus pedidos y favoritos.',
            ogUrl: `https://vcsstore.com${url}`,
            canonicalUrl: `https://vcsstore.com${url}`,
          });
        } else if (url === '/terminos') {
          this.seo.update({
            title: 'Términos y Condiciones',
            description: 'Términos y condiciones de compra en VYRO. Entregas locales en Chapa de Mota, Jilotepec y San Andrés.',
            ogUrl: `https://vcsstore.com${url}`,
            canonicalUrl: `https://vcsstore.com${url}`,
          });
        } else if (url === '/privacidad') {
          this.seo.update({
            title: 'Aviso de Privacidad',
            description: 'Aviso de privacidad de VYRO. Conoce cómo protegemos tus datos personales.',
            ogUrl: `https://vcsstore.com${url}`,
            canonicalUrl: `https://vcsstore.com${url}`,
          });
        } else {
          this.seo.reset();
        }
      });
  }
}
