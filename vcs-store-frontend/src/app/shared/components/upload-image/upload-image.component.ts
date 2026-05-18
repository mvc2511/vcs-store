import { Component, inject, output, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-upload-image',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="upload-container">
      <input
        type="file"
        accept="image/*"
        (change)="onFileSelected($event)"
        #fileInput
        hidden
      />

      <div
        class="upload-zone"
        [class.has-preview]="preview()"
        [class.loading]="cargando()"
        (click)="fileInput.click()"
      >
        <div *ngIf="!preview() && !cargando()" class="upload-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Seleccionar imagen</span>
          <small>PNG, JPG, WEBP</small>
        </div>

        <img *ngIf="preview()" [src]="preview()" alt="Vista previa" class="preview-img" />

        <div *ngIf="cargando()" class="upload-overlay">
          <div class="spinner"></div>
          <span>Subiendo...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-md);
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      min-height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface);
    }
    .upload-zone:hover:not(.loading) {
      border-color: var(--primary);
      background: rgba(108, 63, 236, 0.03);
    }
    .upload-zone.loading {
      cursor: default;
      opacity: 0.7;
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
    }
    .upload-placeholder span {
      font-weight: 500;
      font-size: 0.95rem;
    }
    .upload-placeholder small {
      font-size: 0.8rem;
    }
    .preview-img {
      max-height: 200px;
      border-radius: var(--radius-sm);
      object-fit: contain;
    }
    .upload-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 0.9rem;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class UploadImageComponent {
  private storageService = inject(StorageService);

  readonly urlSubida = output<string>();
  readonly cargando = signal(false);
  readonly preview = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.preview.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    this.cargando.set(true);
    this.storageService.subirImagen(file).then((url) => {
      this.urlSubida.emit(url);
      this.cargando.set(false);
    }).catch((err) => {
      console.error(err);
      this.cargando.set(false);
    });
  }
}
