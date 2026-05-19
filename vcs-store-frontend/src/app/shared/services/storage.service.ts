import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environments';

export interface ImagenSubida {
  url: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async subirImagen(file: File): Promise<ImagenSubida> {
    const extension = file.name.split('.').pop();
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('productos')
      .upload(nombreUnico, file);

    if (uploadError) {
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }

    const { data: publicData } = this.supabase.storage
      .from('productos')
      .getPublicUrl(nombreUnico);

    return { url: publicData.publicUrl, path: nombreUnico };
  }

  async eliminarImagen(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('productos')
      .remove([path]);

    if (error) {
      console.error('Error al eliminar imagen:', error.message);
    }
  }
}
