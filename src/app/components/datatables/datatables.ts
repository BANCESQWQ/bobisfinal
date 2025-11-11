import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { 
  RegistroService, 
  Registro, 
  RegistrosResponse  // ← Agregar esta importación
} from '../../services/registro.service';
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
  searchTerm: string = '';
  currentPage: number = 1;
  perPage: number = 10;
  totalRegistros: number = 0;
  totalPages: number = 0;
  isLoading: boolean = false;

  // Estado del backend
  backendStatus: 'connected' | 'error' | 'checking' = 'checking';
  errorMessage: string = '';

  // Modales
  selectedRegistro: Registro | null = null;
  showViewModal = false;
  showEditModal = false;

  constructor(private registroService: RegistroService) {}

  ngOnInit() {
    console.log('🔍 Inicializando DataTables...');
    this.loadRegistros();
    this.testConnection();
  }

  testConnection() {
  this.backendStatus = 'checking';
  this.registroService.testConnection().subscribe({
    next: (response: any) => {
      console.log('✅ Conexión al backend:', response);
      this.backendStatus = 'connected';
      this.errorMessage = '';
    },
    error: (error) => {
      console.error('❌ Error conectando al backend:', error);
      // Si es error 404, el endpoint no existe pero la conexión funciona
      if (error.status === 404) {
        this.backendStatus = 'connected';
        this.errorMessage = 'Endpoint de test no disponible, pero conexión funciona';
        console.log('⚠️ Endpoint /test-db no existe, pero la conexión HTTP funciona');
      } else {
        this.backendStatus = 'error';
        this.errorMessage = error.message;
      }
    }
  });
}

  getBackendStatusMessage(): string {
    switch (this.backendStatus) {
      case 'connected': return '✅ Conectado al servidor';
      case 'error': return `❌ Error: ${this.errorMessage}`;
      case 'checking': return '⏳ Verificando conexión...';
      default: return 'Estado desconocido';
    }
  }

  loadRegistros() {
    this.isLoading = true;
    console.log('📡 Cargando registros...', {
      page: this.currentPage,
      perPage: this.perPage,
      search: this.searchTerm
    });

    this.registroService.getRegistros(this.currentPage, this.perPage, this.searchTerm).subscribe({
      next: (response: RegistrosResponse) => {
        console.log('📊 Respuesta ADAPTADA del servidor:', response);
        console.log('📋 Datos recibidos:', response.data);
        
        if (response.success) {
          this.registros = response.data;
          this.filteredRegistros = response.data;
          this.totalRegistros = response.pagination.total;
          this.totalPages = response.pagination.pages;
          
          console.log(`✅ ${this.registros.length} registros cargados correctamente`);
          if (this.registros.length > 0) {
            console.log('🔍 Primer registro:', this.registros[0]);
          }
        } else {
          console.error('❌ Servidor respondió con error:', response);
          this.errorMessage = 'Error en la respuesta del servidor';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando registros:', error);
        console.error('❌ Detalles del error:', error.message);
        this.isLoading = false;
        this.backendStatus = 'error';
        this.errorMessage = error.message;
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadRegistros();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadRegistros();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadRegistros();
    }
  }

  viewRegistro(registro: Registro) {
    this.selectedRegistro = registro;
    this.showViewModal = true;
  }

  editRegistro(registro: Registro) {
    this.selectedRegistro = registro;
    this.showEditModal = true;
  }

  onSaveRegistro(updatedRegistro: Registro) {
    console.log('Registro actualizado:', updatedRegistro);
    this.showEditModal = false;
    this.selectedRegistro = null;
    this.loadRegistros();
  }

  deleteRegistro(id: number) {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      console.log('Eliminar registro:', id);
      this.loadRegistros();
    }
  }

  closeModals() {
    this.showViewModal = false;
    this.showEditModal = false;
    this.selectedRegistro = null;
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