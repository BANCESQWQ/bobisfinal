import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Registro } from '../../services/registro.service';

@Component({
  selector: 'app-detalles-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalles-pedido.html',
  styleUrl: './detalles-pedido.scss'
})
export class DetallesPedido {
  @Input() registros: Registro[] = [];
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  // Métodos helper para estadísticas
  getPesoTotal(): number {
    return this.registros.reduce((total, registro) => total + (registro.peso || 0), 0);
  }

  getCantidadTotal(): number {
    return this.registros.reduce((total, registro) => total + (registro.cantidad || 0), 0);
  }

  getProveedoresUnicos(): number {
    const proveedores = new Set(this.registros.map(registro => registro.proveedor_nombre));
    return proveedores.size;
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