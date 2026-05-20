import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notificaciones" aria-live="polite">
      <div 
        *ngFor="let toast of (toastService.toasts$ | async) ?? []"
        class="toast"
        [class]="'toast-' + toast.type"
        role="alert"
      >
        <div class="toast-content">
          <svg *ngIf="toast.type === 'success'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg *ngIf="toast.type === 'error'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <svg *ngIf="toast.type === 'info'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <svg *ngIf="toast.type === 'warning'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" (click)="close(toast.id)" aria-label="Cerrar notificación">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @use 'variables' as *;

    .toast-container {
      position: fixed;
      top: 88px;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.95rem 1.25rem;
      border-radius: $vyro-radius-sm;
      font-family: $vyro-font-sans;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      border-left: 3px solid;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%) translateY(-12px);
      }
      to {
        opacity: 1;
        transform: translateX(0) translateY(0);
      }
    }

    .toast-success {
      background: rgba(#10b981, 0.08);
      color: #047857;
      border-left-color: #10b981;
    }

    .toast-error {
      background: rgba($vyro-error, 0.08);
      color: #991b1b;
      border-left-color: $vyro-error;
    }

    .toast-info {
      background: rgba($vyro-accent, 0.08);
      color: #0e5a8a;
      border-left-color: $vyro-accent;
    }

    .toast-warning {
      background: rgba(#f59e0b, 0.08);
      color: #92400e;
      border-left-color: #f59e0b;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .toast-icon {
      flex-shrink: 0;
    }

    .toast-message {
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: currentColor;
      cursor: pointer;
      padding: 0.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      flex-shrink: 0;
      opacity: 0.7;

      &:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
      }
    }

    @media (max-width: $vyro-bp-mobile) {
      .toast-container {
        left: 1rem;
        right: 1rem;
        max-width: unset;
      }

      .toast {
        font-size: 0.85rem;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  close(id: string) {
    this.toastService.remove(id);
  }
}


