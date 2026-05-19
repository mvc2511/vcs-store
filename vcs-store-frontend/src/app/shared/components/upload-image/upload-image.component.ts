import { Component, output, signal } from '@angular/core';
import { NgIf } from '@angular/common';

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
        (click)="fileInput.click()"
      >
        <div *ngIf="!preview()" class="upload-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Seleccionar imagen</span>
          <small>PNG, JPG, WEBP</small>
        </div>

        <img *ngIf="preview()" [src]="preview()" alt="Vista previa del producto" class="preview-img" loading="lazy" />
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
    .upload-zone:hover {
      border-color: var(--primary);
      background: rgba(108, 63, 236, 0.03);
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
  `],
})
export class UploadImageComponent {
  readonly archivoSeleccionado = output<File>();
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

    this.archivoSeleccionado.emit(file);
  }
}
