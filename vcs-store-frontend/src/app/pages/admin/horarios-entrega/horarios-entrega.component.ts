import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environments';

interface Horario {
  id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const DIAS: Record<number, string> = { 6: 'Sábado', 7: 'Domingo' };

@Component({
  selector: 'app-horarios-entrega',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './horarios-entrega.component.html',
  styleUrl: './horarios-entrega.component.scss',
})
export class HorariosEntregaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  form = this.fb.group({
    dia_semana: [6, Validators.required],
    hora_inicio: ['09:00', Validators.required],
    hora_fin: ['12:00', Validators.required],
    activo: [true],
  });
  horarios: Horario[] = [];
  creando = false;
  editandoId: number | null = null;
  editDia = 6;
  editInicio = '';
  editFin = '';
  editActivo = true;
  eliminandoId: number | null = null;
  errorMsg = '';

  get diaLabel(): Record<number, string> {
    return DIAS;
  }

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.http.get<Horario[]>(`${environment.apiUrl}/api/horarios-entrega`).subscribe({
      next: (data) => (this.horarios = data),
    });
  }

  private tokenHeaders(): HttpHeaders {
    const token = this.authService.sessionToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  crear(): void {
    if (this.form.invalid) return;
    this.creando = true;
    this.errorMsg = '';

    this.http.post(`${environment.apiUrl}/api/horarios-entrega`, this.form.value, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.form.reset({ dia_semana: 6, hora_inicio: '09:00', hora_fin: '12:00', activo: true });
        this.creando = false;
        this.cargar();
      },
      error: (err) => {
        this.creando = false;
        this.errorMsg = err.error?.detail || 'Error al crear horario';
      },
    });
  }

  iniciarEdit(h: Horario): void {
    this.editandoId = h.id;
    this.editDia = h.dia_semana;
    this.editInicio = h.hora_inicio.slice(0, 5);
    this.editFin = h.hora_fin.slice(0, 5);
    this.editActivo = h.activo;
  }

  cancelarEdit(): void {
    this.editandoId = null;
  }

  guardarEdit(id: number): void {
    if (!this.editInicio || !this.editFin) return;

    this.http.put(`${environment.apiUrl}/api/horarios-entrega/${id}`, {
      dia_semana: this.editDia,
      hora_inicio: this.editInicio + ':00',
      hora_fin: this.editFin + ':00',
      activo: this.editActivo,
    }, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.editandoId = null;
        this.cargar();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al actualizar horario';
        this.cancelarEdit();
      },
    });
  }

  eliminar(id: number): void {
    this.eliminandoId = id;
    this.http.delete(`${environment.apiUrl}/api/horarios-entrega/${id}`, { headers: this.tokenHeaders() }).subscribe({
      next: () => {
        this.eliminandoId = null;
        this.cargar();
      },
      error: () => {
        this.eliminandoId = null;
        this.errorMsg = 'Error al eliminar horario';
      },
    });
  }
}
