import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf],
  template: `
    <div class="admin-shell">
      <button class="sidebar-toggle" (click)="sidebarOpen = !sidebarOpen" aria-label="Toggle navigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <aside class="admin-sidebar" [class.open]="sidebarOpen" aria-label="Panel de administración">
        <div class="sidebar-brand">
          <div class="brand-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="brand-text">VCS</span>
          <span class="brand-accent">Admin</span>
        </div>

        <nav class="sidebar-nav">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="nav-item"
            (click)="sidebarOpen = false"
          >
            <span class="nav-icon" [innerHTML]="item.icon"></span>
            {{ item.label }}
          </a>
        </nav>

        <a routerLink="/" class="back-link" (click)="sidebarOpen = false">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver a la tienda
        </a>
      </aside>

      <div class="sidebar-overlay" *ngIf="sidebarOpen" (click)="sidebarOpen = false"></div>

      <main class="admin-main">
        <nav class="mobile-nav" aria-label="Navegación administración">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.path"
            routerLinkActive="active-mobile"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="m-nav-item"
          >
            <span class="nav-icon" [innerHTML]="item.icon"></span>
            {{ item.label }}
          </a>
        </nav>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .admin-shell {
      display: flex;
      min-height: calc(100vh - 64px);
      background: var(--bg);
      position: relative;
    }
    .sidebar-toggle {
      display: none;
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 1001;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--gradient);
      color: #fff;
      border: none;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      cursor: pointer;
    }
    .admin-sidebar {
      width: 220px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0 1.25rem 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0.75rem;
    }
    .brand-icon {
      width: 30px;
      height: 30px;
      background: var(--gradient);
      color: #fff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .brand-text {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text);
    }
    .brand-accent {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 1.05rem;
      background: var(--gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0 0.65rem;
      flex: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    .nav-item:hover {
      color: var(--text);
      background: #f0f0f5;
    }
    .nav-item.active {
      color: var(--primary);
      background: rgba(108, 63, 236, 0.08);
    }
    .nav-icon {
      display: flex;
      align-items: center;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    .back-link {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.75rem 1.25rem;
      margin: 0 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all 0.2s;
      border-top: 1px solid var(--border);
      margin-top: auto;
    }
    .back-link:hover {
      color: var(--primary);
      background: rgba(108, 63, 236, 0.06);
    }
    .sidebar-overlay {
      display: none;
    }
    .mobile-nav {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1.5rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .mobile-nav::-webkit-scrollbar { display: none; }
    .m-nav-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
      transition: all 0.2s;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .m-nav-item:hover {
      color: var(--text);
      border-color: var(--text-secondary);
    }
    .active-mobile {
      color: var(--primary);
      background: rgba(108, 63, 236, 0.06);
      border-color: var(--primary);
    }
    .m-nav-item .nav-icon { width: 16px; height: 16px; }
    .admin-main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      max-width: 1100px;
      min-width: 0;
    }

    @media (max-width: 767px) {
      .admin-shell { flex-direction: column; }
      .admin-sidebar {
        position: fixed;
        top: 0;
        left: -280px;
        height: 100vh;
        z-index: 1002;
        width: 260px;
        transition: left 0.25s ease;
        box-shadow: var(--shadow-lg);
      }
      .admin-sidebar.open { left: 0; }
      .sidebar-toggle { display: flex; }
      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.3);
        z-index: 1001;
      }
      .mobile-nav { display: flex; }
      .admin-main {
        padding: 1rem;
      }
    }
    @media (min-width: 768px) {
      .mobile-nav { display: none; }
    }
  `],
})
export class AdminLayoutComponent {
  sidebarOpen = false;

  navItems = [
    { path: '/admin/productos', label: 'Productos', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', exact: false },
    { path: '/admin/categorias', label: 'Categorías', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7v7H4z"/><path d="M15 4h5v5h-5z"/><path d="M15 15h5v5h-5z"/><path d="M4 15h7v7H4z"/></svg>', exact: false },
    { path: '/admin/ordenes', label: 'Órdenes', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', exact: false },
    { path: '/admin/puntos-entrega', label: 'Puntos de Entrega', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>', exact: false },
  ];
}
