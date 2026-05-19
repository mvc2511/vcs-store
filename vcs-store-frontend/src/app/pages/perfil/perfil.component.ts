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
  template: `
    <div class="perfil">
      <div class="perfil-card">
        <h1>Mi Perfil</h1>

        <div *ngIf="mensaje()" class="msg" [class.msg-exito]="esExito()">{{ mensaje() }}</div>
        <div *ngIf="error()" class="msg msg-error">{{ error() }}</div>

        <div class="field">
          <label>Email</label>
          <p class="field-readonly">{{ email }}</p>
        </div>

        <div class="field">
          <label for="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            [(ngModel)]="nombre"
            placeholder="Tu nombre"
            (keyup.enter)="guardarNombre()"
          />
        </div>

        <button class="btn-primary" (click)="guardarNombre()" [disabled]="guardandoNombre() || !nombre.trim()">
          {{ guardandoNombre() ? 'Guardando...' : 'Guardar nombre' }}
        </button>

        <hr class="divider" />

        <h2>Cambiar contraseña</h2>

        <div class="field">
          <label for="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            type="password"
            [(ngModel)]="newPassword"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div class="field">
          <label for="confirm-new-password">Confirmar contraseña</label>
          <input
            id="confirm-new-password"
            type="password"
            [(ngModel)]="confirmNewPassword"
            placeholder="Repite la contraseña"
          />
        </div>

        <button class="btn-primary" (click)="cambiarPassword()" [disabled]="cambiandoPassword()">
          {{ cambiandoPassword() ? 'Cambiando...' : 'Cambiar contraseña' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .perfil {
      max-width: 480px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .perfil-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 2rem;
    }
    .perfil-card h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: var(--text);
    }
    .perfil-card h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
    }
    .field label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .field input {
      padding: 0.65rem 0.8rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      background: var(--bg);
      color: var(--text);
      transition: border-color 0.2s;
      outline: none;
    }
    .field input:focus {
      border-color: var(--primary);
    }
    .field-readonly {
      padding: 0.65rem 0.8rem;
      background: var(--bg);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--text-secondary);
      border: 1px solid var(--border);
      opacity: 0.7;
    }
    .btn-primary {
      padding: 0.65rem 1.5rem;
      background: var(--gradient);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }
    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 1.75rem 0;
    }
    .msg {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 1rem;
      text-align: center;
      font-weight: 500;
    }
    .msg-exito {
      background: rgba(72, 199, 142, 0.1);
      color: #2d9b6e;
    }
    .msg-error {
      background: rgba(255, 107, 107, 0.1);
      color: var(--secondary);
    }

    @media (max-width: 500px) {
      .perfil { padding: 1rem; }
      .perfil-card { padding: 1.25rem; }
    }
  `],
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
