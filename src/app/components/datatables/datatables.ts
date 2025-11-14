import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService, Registro } from '../../services/registro.service';
import { UserViewModal } from '../user-view-modal/user-view-modal';
import { UserEditModal } from '../user-edit-modal/user-edit-modal';

@Component({
  selector: 'app-datatables',
  standalone: true,
  imports: [CommonModule, FormsModule, UserViewModal, UserEditModal],
  templateUrl: './datatables.html',
  styleUrl: './datatables.scss'
})
export class Datatables implements OnInit {
  registros: Registro[] = [];
  filteredRegistros: Registro[] = [];
  isLoading = true;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  backendStatus: 'connected' | 'error' | 'checking' = 'checking';

  // Estados para modales
  selectedRegistro: Registro | null = null;
  showViewModal = false;
  showEditModal = false;

  constructor(private registroService: RegistroService) {}

  ngOnInit() {
    this.checkBackendConnection();
    this.loadRegistros();
  }

  checkBackendConnection() {
    this.registroService.testConnection().subscribe({
      next: () => {
        this.backendStatus = 'connected';
      },
      error: () => {
        this.backendStatus = 'error';
      }
    });
  }

  loadRegistros() {
    this.isLoading = true;
    this.registroService.getRegistros(this.currentPage, this.itemsPerPage, this.searchTerm)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.registros = response.data;
            this.filteredRegistros = response.data;
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.pages;
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando registros:', error);
          this.isLoading = false;
          this.backendStatus = 'error';
        }
      });
  }

  applyFilters() {
    if (!this.searchTerm.trim()) {
      this.filteredRegistros = this.registros;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredRegistros = this.registros.filter(registro =>
      registro.pedido_compra?.toLowerCase().includes(searchLower) ||
      registro.colada?.toLowerCase().includes(searchLower) ||
      registro.observaciones?.toLowerCase().includes(searchLower) ||
      registro.proveedor_nombre?.toLowerCase().includes(searchLower) ||
      registro.bobina_desc?.toLowerCase().includes(searchLower) ||
      registro.estado_desc?.toLowerCase().includes(searchLower)
    );
  }

  getBackendStatusMessage(): string {
    switch (this.backendStatus) {
      case 'connected': return 'Conectado';
      case 'error': return 'Error de conexión';
      case 'checking': return 'Verificando...';
      default: return 'Desconocido';
    }
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

  // Navegación de páginas
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRegistros();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRegistros();
    }
  }

  // Funciones para modales
  viewRegistro(registro: Registro) {
    this.selectedRegistro = registro;
    this.showViewModal = true;
  }

  editRegistro(registro: Registro) {
    this.selectedRegistro = registro;
    this.showEditModal = true;
  }

  deleteRegistro(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      console.log('Eliminar registro:', id);
      // Aquí iría la llamada al servicio para eliminar
      // Por ahora solo recargamos los datos
      this.loadRegistros();
    }
  }

  onSaveRegistro(registro: Registro) {
    console.log('Guardar registro:', registro);
    // Aquí iría la llamada al servicio para guardar
    // Por ahora solo cerramos el modal y recargamos
    this.closeModals();
    this.loadRegistros();
  }

  closeModals() {
    this.showViewModal = false;
    this.showEditModal = false;
    this.selectedRegistro = null;
  }
}