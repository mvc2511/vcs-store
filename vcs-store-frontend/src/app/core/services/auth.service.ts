import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;
  private userSignal = signal<User | null>(null);
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = signal(false);

  private sessionTokenSignal = signal<string | null>(null);
  readonly sessionToken = this.sessionTokenSignal.asReadonly();

  private perfilSignal = signal<{ rol: string } | null>(null);
  readonly perfil = this.perfilSignal.asReadonly();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    this.supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      this.userSignal.set(user);
      this.isLoggedIn.set(!!user);
      this.sessionTokenSignal.set(session?.access_token ?? null);
      if (user) this.cargarPerfil();
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      this.userSignal.set(user);
      this.isLoggedIn.set(!!user);
      this.sessionTokenSignal.set(session?.access_token ?? null);
      if (user) this.cargarPerfil();
      else this.perfilSignal.set(null);
    });
  }

  async cargarPerfil(): Promise<{ rol: string } | null> {
    const user = this.userSignal();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error al cargar perfil:', error.message);
      return null;
    }

    this.perfilSignal.set(data as { rol: string } | null);
    return this.perfilSignal();
  }

  async loginWithGoogle() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error OAuth:', error.message);
  }

  private mapAuthError(error: any): string {
    const msg = error?.message || '';
    if (msg.includes('Database error saving new user')) {
      return 'Error al crear tu cuenta. El registro está temporalmente deshabilitado.';
    }
    if (msg.includes('User already registered')) {
      return 'Este correo ya está registrado. Intenta iniciar sesión.';
    }
    if (msg.includes('Invalid login credentials')) {
      return 'Correo o contraseña incorrectos.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
    }
    if (msg.includes('Password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (msg.includes('rate limit')) {
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.';
    }
    if (msg.includes('NetworkError') || msg.includes('network')) {
      return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    }
    return 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
  }

  async signInWithEmail(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return this.mapAuthError(error);
    return null;
  }

  async signUpWithEmail(email: string, password: string): Promise<string | null> {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return this.mapAuthError(error);
    return null;
  }

  async logout() {
    await this.supabase.auth.signOut();
  }
}
