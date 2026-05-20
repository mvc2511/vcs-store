import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  esRegistro = signal(false);
  email = '';
  password = '';
  confirmPassword = '';
  nombre = '';
  aceptaTerminos = false;
  error = signal('');
  loading = signal(false);
  returnUrl = '/';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
  }

  toggleModo(): void {
    this.esRegistro.update((v) => !v);
    this.error.set('');
  }

  getPasswordStrength(): { level: number; label: string; color: string } {
    const pwd = this.password;
    if (!pwd) return { level: 0, label: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength++;

    if (strength < 2) return { level: 1, label: 'Débil', color: '#DC2626' };
    if (strength < 3) return { level: 2, label: 'Media', color: '#EA580C' };
    if (strength < 4) return { level: 3, label: 'Buena', color: '#FBBF24' };
    return { level: 4, label: 'Muy fuerte', color: '#059669' };
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }
    if (this.esRegistro()) {
      if (!this.nombre.trim()) {
        this.error.set('Ingresa tu nombre completo');
        return;
      }
      if (this.password.length < 6) {
        this.error.set('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.error.set('Las contraseñas no coinciden');
        return;
      }
      if (!this.aceptaTerminos) {
        this.error.set('Debes aceptar los términos y condiciones');
        return;
      }
    }
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.esRegistro()) {
        const err = await this.authService.signUpWithEmail(this.email, this.password, this.nombre);
        if (err) {
          this.error.set(err);
        } else {
          this.error.set(`Te enviamos un correo a ${this.email} para confirmar tu cuenta. Revisa tu bandeja de entrada y haz clic en el enlace. ¿No lo recibiste? Revisa spam.`);
        }
      } else {
        const err = await this.authService.signInWithEmail(this.email, this.password);
        if (err) {
          this.error.set(err);
        } else {
          this.router.navigateByUrl(this.returnUrl);
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
