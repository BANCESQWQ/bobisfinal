import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  getStatusClass(estadoId: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'bg-green-100 text-green-800 border-green-200',
      2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      3: 'bg-red-100 text-red-800 border-red-200',
      4: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return statusMap[estadoId] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getEstadoText(estadoId: number): string {
    const estadoMap: { [key: number]: string } = {
      1: 'Activo',
      2: 'Pendiente',
      3: 'Inactivo',
      4: 'Procesando'
    };
    return estadoMap[estadoId] || 'Desconocido';
  }
}