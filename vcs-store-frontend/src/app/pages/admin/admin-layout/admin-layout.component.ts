import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact: boolean;
  badge?: 'stock';
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  sidebarOpen = false;
  stockBajoCount = signal(0);
  private stockInterval: ReturnType<typeof setInterval> | null = null;

  navItems: NavItem[] = [
    { path: '/admin/productos', label: 'Productos', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', exact: false, badge: 'stock' },
    { path: '/admin/categorias', label: 'Categorías', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7v7H4z"/><path d="M15 4h5v5h-5z"/><path d="M15 15h5v5h-5z"/><path d="M4 15h7v7H4z"/></svg>', exact: false },
    { path: '/admin/cupones', label: 'Cupones', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12H4"/><path d="M20 12a2 2 0 0 1-2 2v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6a2 2 0 0 1 0-4V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a2 2 0 0 1 2 2z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/></svg>', exact: false },
    { path: '/admin/precios-mayoreo', label: 'Precios Mayoreo', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', exact: false },
    { path: '/admin/ordenes', label: 'Órdenes', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', exact: false },
    { path: '/admin/puntos-entrega', label: 'Puntos de Entrega', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>', exact: false },
    { path: '/admin/horarios-entrega', label: 'Horarios Entrega', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', exact: false },
    { path: '/admin/tallas', label: 'Tallas', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v4H4z"/><path d="M4 10h16v4H4z"/><path d="M4 16h16v4H4z"/></svg>', exact: false },
    { path: '/admin/colores', label: 'Colores', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', exact: false },
    { path: '/admin/opciones-ml', label: 'Mililitros', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', exact: false },
  ];

  ngOnInit(): void {
    this.cargarStockBajo();
    this.stockInterval = setInterval(() => this.cargarStockBajo(), 60000);
  }

  ngOnDestroy(): void {
    if (this.stockInterval) clearInterval(this.stockInterval);
  }

  private cargarStockBajo(): void {
    const token = this.authService.sessionToken();
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    this.http.get<any>(`${environment.apiUrl}/api/admin/stock-bajo?umbral=10`, { headers }).subscribe({
      next: (res) => this.stockBajoCount.set(res.total_count ?? res.length ?? 0),
      error: () => {},
    });
  }
}
