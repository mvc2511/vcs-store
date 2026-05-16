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
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      this.userSignal.set(user);
      this.isLoggedIn.set(!!user);
      this.sessionTokenSignal.set(session?.access_token ?? null);
    });
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

  async logout() {
    await this.supabase.auth.signOut();
  }
}
