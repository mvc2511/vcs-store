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
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'mis-pedidos',
    loadComponent: () =>
      import('./pages/mis-pedidos/mis-pedidos.component').then(
        (m) => m.MisPedidosComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/perfil/perfil.component').then(
        (m) => m.PerfilComponent
      ),
    canActivate: [authGuard],
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
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/admin/productos/admin-productos.component').then(
            (m) => m.AdminProductosComponent
          ),
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./pages/admin/producto-form/producto-form.component').then(
            (m) => m.ProductoFormComponent
          ),
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () =>
          import('./pages/admin/producto-form/producto-form.component').then(
            (m) => m.ProductoFormComponent
          ),
      },
      {
        path: 'ordenes',
        loadComponent: () =>
          import('./pages/admin/admin-ordenes/admin-ordenes.component').then(
            (m) => m.AdminOrdenesComponent
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./pages/admin/categorias/categorias.component').then(
            (m) => m.CategoriasComponent
          ),
      },
      {
        path: 'puntos-entrega',
        loadComponent: () =>
          import('./pages/admin/puntos-entrega/puntos-entrega.component').then(
            (m) => m.PuntosEntregaComponent
          ),
      },
      {
        path: 'tallas',
        loadComponent: () =>
          import('./pages/admin/tallas/tallas.component').then(
            (m) => m.TallasComponent
          ),
      },
      {
        path: 'colores',
        loadComponent: () =>
          import('./pages/admin/colores/colores.component').then(
            (m) => m.ColoresComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
