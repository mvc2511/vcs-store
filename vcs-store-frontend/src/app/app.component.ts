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
            title: 'Carrito',
            description: 'Revisa tu carrito en VYRO. Ropa, perfumes y accesorios al mayoreo y granel. Entregas en Chapa de Mota, Jilotepec y San Andrés.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/sobre-pedido') {
          this.seo.update({
            title: 'Perfumes Sobre Pedido',
            description: 'Catálogo completo de perfumes sobre pedido en VYRO. Fragancias que conseguimos especialmente para ti. Entrega los fines de semana.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/login') {
          this.seo.update({
            title: 'Iniciar Sesión',
            description: 'Accede a tu cuenta en VYRO para gestionar tus pedidos, favoritos y más.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/favoritos') {
          this.seo.update({
            title: 'Mis Favoritos',
            description: 'Tus productos favoritos en VYRO. Guarda ropa, perfumes y más para después.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/mis-pedidos') {
          this.seo.update({
            title: 'Mis Pedidos',
            description: 'Historial y seguimiento de tus pedidos en VYRO. Entregas locales en Chapa de Mota, Jilotepec y San Andrés.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/perfil') {
          this.seo.update({
            title: 'Mi Perfil',
            description: 'Administra tu perfil en VYRO: edita tu nombre, cambia tu contraseña y actualiza tu avatar.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/success') {
          this.seo.update({
            title: 'Pedido Confirmado',
            description: 'Tu pedido en VYRO ha sido confirmado. Gracias por tu pedido.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/terminos') {
          this.seo.update({
            title: 'Términos y Condiciones',
            description: 'Términos y condiciones de VYRO. Entregas locales en Chapa de Mota, Jilotepec y San Andrés, Estado de México.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else if (url === '/privacidad') {
          this.seo.update({
            title: 'Aviso de Privacidad',
            description: 'Aviso de privacidad de VYRO. Conoce cómo protegemos tus datos personales en nuestra tienda local.',
            ogUrl: `https://vyro.boutique${url}`,
            canonicalUrl: `https://vyro.boutique${url}`,
          });
        } else {
          this.seo.reset();
        }
      });
  }
}
