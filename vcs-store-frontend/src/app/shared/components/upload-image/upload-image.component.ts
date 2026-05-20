import { Component, output, signal } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-upload-image',
  standalone: true,
  imports: [NgIf],
  templateUrl: './upload-image.component.html',
  styleUrl: './upload-image.component.scss',
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
