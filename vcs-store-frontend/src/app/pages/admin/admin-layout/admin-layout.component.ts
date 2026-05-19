import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar" aria-label="Panel de administración">
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
          >
            <span class="nav-icon" [innerHTML]="item.icon"></span>
            {{ item.label }}
          </a>
        </nav>

        <a routerLink="/" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver a la tienda
        </a>
      </aside>

      <main class="admin-main">
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
    .admin-main {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      max-width: 1100px;
    }
  `],
})
export class AdminLayoutComponent {
  navItems = [
    { path: '/admin/productos', label: 'Productos', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>', exact: false },
    { path: '/admin/categorias', label: 'Categorías', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h7v7H4z"/><path d="M15 4h5v5h-5z"/><path d="M15 15h5v5h-5z"/><path d="M4 15h7v7H4z"/></svg>', exact: false },
  ];
}
