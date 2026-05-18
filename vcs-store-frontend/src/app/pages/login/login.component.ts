import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  esRegistro = signal(false);
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  toggleModo(): void {
    this.esRegistro.update((v) => !v);
    this.error.set('');
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.esRegistro()) {
        const err = await this.authService.signUpWithEmail(this.email, this.password);
        if (err) {
          this.error.set(err);
        } else {
          this.error.set('Revisa tu correo para confirmar el registro');
        }
      } else {
        const err = await this.authService.signInWithEmail(this.email, this.password);
        if (err) {
          this.error.set(err);
        } else {
          this.router.navigate(['/']);
        }
      }
    } catch (err: any) {
      this.error.set('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    await this.authService.loginWithGoogle();
  }
}
