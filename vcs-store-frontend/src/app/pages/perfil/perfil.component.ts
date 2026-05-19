import { Component, inject, OnInit, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private supabase: SupabaseClient;

  email = '';
  nombre = '';
  newPassword = '';
  confirmNewPassword = '';
  guardandoNombre = signal(false);
  cambiandoPassword = signal(false);
  mensaje = signal('');
  error = signal('');
  esExito = signal(false);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  ngOnInit(): void {
    const user = this.authService.user();
    if (user) {
      this.email = user.email || '';
      this.cargarNombre();
    }
  }

  private async cargarNombre(): Promise<void> {
    const user = this.authService.user();
    if (!user) return;
    const { data } = await this.supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', user.id)
      .maybeSingle();
    if (data?.nombre) {
      this.nombre = data.nombre;
    }
  }

  async guardarNombre(): Promise<void> {
    const user = this.authService.user();
    if (!user || !this.nombre.trim()) return;

    this.guardandoNombre.set(true);
    this.error.set('');
    this.mensaje.set('');

    const { error } = await this.supabase
      .from('perfiles')
      .update({ nombre: this.nombre.trim() })
      .eq('id', user.id);

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
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.cambiandoPassword.set(true);
    this.error.set('');
    this.mensaje.set('');

    const { error } = await this.supabase.auth.updateUser({
      password: this.newPassword,
    });

    this.cambiandoPassword.set(false);
    if (error) {
      this.error.set(error.message);
    } else {
      this.mensaje.set('Contraseña cambiada correctamente');
      this.esExito.set(true);
      this.newPassword = '';
      this.confirmNewPassword = '';
    }
  }
}
