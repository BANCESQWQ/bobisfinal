import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Registro } from '../../services/registro.service';

@Component({
  selector: 'app-user-view-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-view-modal.html',
  styleUrl: './user-view-modal.scss'
})
export class UserViewModal {
  @Input() registro: Registro | null = null;
  @Input() visible = false;

  close() {
    this.visible = false;
  }

  getStatusClass(estadoId: number): string {
    switch (estadoId) {
      case 1: return 'bg-green-100 text-green-800 border border-green-200';
      case 2: return 'bg-red-100 text-red-800 border border-red-200';
      case 3: return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getEstadoText(estadoId: number): string {
    switch (estadoId) {
      case 1: return 'Activo';
      case 2: return 'Inactivo';
      case 3: return 'Pendiente';
      default: return 'Desconocido';
    }
  }
}