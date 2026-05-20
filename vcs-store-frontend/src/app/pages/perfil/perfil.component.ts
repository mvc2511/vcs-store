import { Component, inject, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';
import { StorageService } from '../../shared/services/storage.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private storageService = inject(StorageService);

  email = '';
  nombre = '';
  newPassword = '';
  confirmNewPassword = '';
  guardandoNombre = signal(false);
  cambiandoPassword = signal(false);
  subiendoAvatar = signal(false);
  mensaje = signal('');
  error = signal('');
  esExito = signal(false);
  avatarUrl = signal('');

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.email = user.email || '';
      this.avatarUrl.set(user.user_metadata?.['avatar_url'] || '');
      this.cargarNombre();
    }
  }

  private limpiarMensajes(): void {
    this.mensaje.set('');
    this.error.set('');
    this.esExito.set(false);
  }

  private async cargarNombre(): Promise<void> {
    const user = this.authService.user();
    if (!user) return;
    const { data } = await this.supabaseService.getPerfil(user.id);
    if (data?.nombre) {
      this.nombre = data.nombre;
    }
  }

  async guardarNombre(): Promise<void> {
    const user = this.authService.user();
    if (!user || !this.nombre.trim()) return;

    this.limpiarMensajes();
    this.guardandoNombre.set(true);

    const { error } = await this.supabaseService.actualizarNombre(user.id, this.nombre.trim());

    this.guardandoNombre.set(false);
    if (error) {
      this.error.set('Error al guardar el nombre');
    } else {
      this.mensaje.set('Nombre actualizado correctamente');
      this.esExito.set(true);
    }
  }

  async cambiarPassword(): Promise<void> {
    if (this.newPassword.length < 6) {
      this.error.set('La contraseña debe tener al least 6 caracteres');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.limpiarMensajes();
    this.cambiandoPassword.set(true);

    const { error } = await this.authService.updatePassword(this.newPassword);

    this.cambiandoPassword.set(false);
    if (error) {
      this.error.set(error.message || 'Error al cambiar la contraseña');
    } else {
      this.mensaje.set('Contraseña cambiada correctamente');
      this.esExito.set(true);
      this.newPassword = '';
      this.confirmNewPassword = '';
    }
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error.set('Selecciona una imagen válida');
      return;
    }

    this.limpiarMensajes();
    this.subiendoAvatar.set(true);

    try {
      const result = await this.storageService.subirAvatar(file);
      const { error } = await this.authService.updateAvatar(result.url);
      if (error) {
        this.error.set('Error al guardar el avatar');
        return;
      }
      this.avatarUrl.set(result.url);
      this.mensaje.set('Avatar actualizado correctamente');
      this.esExito.set(true);
    } catch (err) {
      this.error.set('Error al subir la imagen');
      console.error('[Perfil] Error uploading avatar:', err);
    } finally {
      this.subiendoAvatar.set(false);
      input.value = '';
    }
  }
}
