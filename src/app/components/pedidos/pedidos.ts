import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService, Registro } from '../../services/registro.service';
import { UserViewModal } from '../user-view-modal/user-view-modal';
import { DetallesPedido } from '../detalles-pedido/detalles-pedido';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, UserViewModal, DetallesPedido],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss'
})
export class Pedidos implements OnInit {
  registros: Registro[] = [];
  filteredRegistros: Registro[] = [];
  registrosSeleccionados: Registro[] = [];
  isLoading = true;
  searchTerm = '';
  observacionesDespacho = '';
  selectedRegistro: Registro | null = null;
  showViewModal = false;
  showDetallesPedidoModal = false;

  // Variables para drag and drop
  dragItem: Registro | null = null;

  constructor(private registroService: RegistroService) {}

  ngOnInit() {
    this.loadRegistros();
  }

  loadRegistros() {
    this.isLoading = true;
    this.registroService.getRegistros(1, 100, '')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.registros = response.data;
            this.filteredRegistros = this.ordenarRegistros(response.data);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando registros:', error);
          this.isLoading = false;
        }
      });
  }

  ordenarRegistros(registros: Registro[]): Registro[] {
    return registros.sort((a, b) => {
      const dateA = new Date(a.fecha_ingreso_planta || '');
      const dateB = new Date(b.fecha_ingreso_planta || '');
      return dateA.getTime() - dateB.getTime();
    });
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
  aplicarFiltros() {
    if (!this.searchTerm.trim()) {
      this.filteredRegistros = this.ordenarRegistros(this.registros);
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredRegistros = this.ordenarRegistros(
      this.registros.filter(registro =>
        registro.bobina_desc?.toLowerCase().includes(searchLower) ||
        registro.colada?.toLowerCase().includes(searchLower) ||
        registro.lote?.toString().includes(searchLower) ||
        registro.cod_bobin2?.toString().includes(searchLower)
      )
    );
  }

  // Drag and Drop functions
  onDragStart(registro: Registro, event: DragEvent) {
    this.dragItem = registro;
    event.dataTransfer?.setData('text/plain', registro.id_registro.toString());
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (this.dragItem && !this.estaSeleccionado(this.dragItem)) {
      this.seleccionarRegistro(this.dragItem);
    }
    this.dragItem = null;
  }

  // Gestión de selección
  seleccionarRegistro(registro: Registro) {
    if (!this.estaSeleccionado(registro)) {
      this.registrosSeleccionados.push(registro);
    }
  }

  quitarRegistro(registro: Registro) {
    this.registrosSeleccionados = this.registrosSeleccionados.filter(
      r => r.id_registro !== registro.id_registro
    );
  }

  estaSeleccionado(registro: Registro): boolean {
    return this.registrosSeleccionados.some(
      r => r.id_registro === registro.id_registro
    );
  }

  // Modals
  verDetalles(registro: Registro, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedRegistro = registro;
    this.showViewModal = true;
  }

  verDetallesPedido() {
    this.showDetallesPedidoModal = true;
  }

  closeModals() {
    this.showViewModal = false;
    this.showDetallesPedidoModal = false;
    this.selectedRegistro = null;
  }

  // Envío de despacho
  enviarDespacho() {
    if (this.registrosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un registro para despachar');
      return;
    }

    const despachoData = {
      registros: this.registrosSeleccionados.map(r => r.id_registro),
      observaciones: this.observacionesDespacho,
      fecha: new Date().toISOString()
    };

    console.log('Enviando despacho:', despachoData);
    alert(`Despacho enviado con ${this.registrosSeleccionados.length} registros`);
    this.registrosSeleccionados = [];
    this.observacionesDespacho = '';
  }
}