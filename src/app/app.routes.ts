import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'producto/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'success',
    loadComponent: () =>
      import('./pages/success/success.component').then(
        (m) => m.SuccessComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin/productos/nuevo',
    loadComponent: () =>
      import('./pages/admin/nuevo-producto/nuevo-producto.component').then(
        (m) => m.NuevoProductoComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/categorias',
    loadComponent: () =>
      import('./pages/admin/categorias/categorias.component').then(
        (m) => m.CategoriasComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
