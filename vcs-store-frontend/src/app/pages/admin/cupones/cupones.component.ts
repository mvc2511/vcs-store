import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CurrencyPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Cupon {
  id: number;
  codigo: string;
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  minimo_compra: number | null;
  usos_maximos: number | null;
  usos_actuales: number;
  fecha_expiracion: string | null;
  activo: boolean;
  creado_en: string;
}

@Component({
  selector: 'app-cupones',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, CurrencyPipe, DatePipe],
  templateUrl: './cupones.component.html',
  styleUrl: './cupones.component.scss',
})
export class CuponesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({
    codigo: ['', Validators.required],
    tipo: ['porcentaje' as 'porcentaje' | 'fijo'],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    minimo_compra: [0],
    usos_maximos: [0],
    fecha_expiracion: [''],
    activo: [true],
  });

  cupones: Cupon[] = [];
  creando = false;
  editandoId: number | null = null;
  editForm = this.fb.group({
    codigo: ['', Validators.required],
    tipo: ['porcentaje' as 'porcentaje' | 'fijo'],
    valor: [0, [Validators.required, Validators.min(0.01)]],
    minimo_compra: [0],
    usos_maximos: [0],
    fecha_expiracion: [''],
    activo: [true],
  });
  eliminandoId: number | null = null;
  errorMsg = '';

  ngOnInit(): void {
    this.cargarCupones();
  }

  private cargarCupones(): void {
    this.http.get<Cupon[]>(`${environment.apiUrl}/api/cupones`, { headers: this.tokenHeaders() }).subscribe({
      next: (data) => (this.cupones = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crearCupon(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    const body: Record<string, any> = { ...this.form.value };
    if (!body['minimo_compra']) body['minimo_compra'] = null;
    if (!body['usos_maximos']) body['usos_maximos'] = null;
    if (!body['fecha_expiracion']) body['fecha_expiracion'] = null;

    this.http.post(`${environment.apiUrl}/api/cupones`, body, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset({ tipo: 'porcentaje', valor: 0, minimo_compra: 0, usos_maximos: 0, fecha_expiracion: '', activo: true });
        this.creando = false;
        this.cargarCupones();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear cupón';
      },
    });
  }

  iniciarEdit(c: Cupon): void {
    this.editandoId = c.id;
    this.editForm.patchValue({
      codigo: c.codigo,
      tipo: c.tipo,
      valor: c.valor,
      minimo_compra: c.minimo_compra ?? 0,
      usos_maximos: c.usos_maximos ?? 0,
      fecha_expiracion: c.fecha_expiracion ? c.fecha_expiracion.split('T')[0] : '',
      activo: c.activo,
    });
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number): void {
    if (this.editForm.invalid) return;
    const body: Record<string, any> = { ...this.editForm.value };
    if (!body['minimo_compra']) body['minimo_compra'] = null;
    if (!body['usos_maximos']) body['usos_maximos'] = null;
    if (!body['fecha_expiracion']) body['fecha_expiracion'] = null;

    this.http.put(`${environment.apiUrl}/api/cupones/${id}`, body, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.editandoId = null; this.cargarCupones(); },
      error: (err) => { this.errorMsg = err.error?.detail || 'Error al actualizar cupón'; this.cancelarEdit(); },
    });
  }

  eliminarCupon(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/cupones/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => { this.eliminandoId = null; this.cargarCupones(); },
      error: () => { this.eliminandoId = null; this.errorMsg = 'Error al eliminar cupón'; },
    });
  }
}
