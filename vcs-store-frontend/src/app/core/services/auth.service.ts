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

  async signInWithEmail(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async signUpWithEmail(email: string, password: string) {
    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async logout() {
    await this.supabase.auth.signOut();
  }
}
