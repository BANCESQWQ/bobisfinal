import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionService, TablaGestion, GestionResponse } from '../../services/gestion.service';

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion.html',
  styleUrl: './gestion.scss'
})
export class Gestion implements OnInit {
  tablas: TablaGestion[] = [];
  tablaActiva: TablaGestion | null = null;
  datosTabla: any[] = [];
  nuevoRegistro: any = {};
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  procedencias: any[] = [];

  constructor(private gestionService: GestionService) {}

  ngOnInit() {
    this.tablas = this.gestionService.tablas;
    if (this.tablas.length > 0) {
      this.cambiarTabla(this.tablas[0]);
    }
    this.cargarProcedencias();
  }

  cargarProcedencias() {
    this.gestionService.getOpcionesProcedencias().subscribe({
      next: (response: GestionResponse) => {
        if (response.success) {
          this.procedencias = response.data;
          console.log('Procedencias cargadas:', this.procedencias);
          // Actualizar las opciones del campo PROCEDENCIA_ID_PROCED en MOLINO
          const tablaMolino = this.tablas.find(t => t.nombre === 'MOLINO');
          if (tablaMolino) {
            const campoProcedencia = tablaMolino.campos.find(c => c.nombre === 'PROCEDENCIA_ID_PROCED');
            if (campoProcedencia) {
              campoProcedencia.opciones = this.procedencias;
            }
          }
        } else {
          console.error('Error cargando procedencias:', response.error);
        }
      },
      error: (error) => {
        console.error('Error cargando procedencias:', error);
      }
    });
  }

  cambiarTabla(tabla: TablaGestion) {
    this.tablaActiva = tabla;
    this.nuevoRegistro = {};
    this.errorMessage = '';
    this.successMessage = '';
    this.cargarDataTabla();
  }

  cargarDataTabla() {
    if (!this.tablaActiva) return;

    this.isLoading = true;
    this.errorMessage = '';
    
    this.gestionService.getDataTabla(this.tablaActiva.nombre).subscribe({
      next: (response: GestionResponse) => {
        if (response.success) {
          this.datosTabla = response.data;
          console.log(`Datos de ${this.tablaActiva?.nombreDisplay} cargados:`, this.datosTabla);
        } else {
          this.errorMessage = response.error || 'Error al cargar los datos';
          console.error('Error en respuesta:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.errorMessage = `Error de conexión: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  agregarRegistro() {
    if (!this.tablaActiva || !this.validarRegistro()) {
      this.errorMessage = 'Por favor completa todos los campos requeridos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('Enviando datos:', this.nuevoRegistro);

    this.gestionService.agregarRegistro(this.tablaActiva.nombre, this.nuevoRegistro).subscribe({
      next: (response: GestionResponse) => {
        if (response.success) {
          this.successMessage = response.message || 'Registro agregado exitosamente.';
          this.nuevoRegistro = {};
          this.cargarDataTabla(); // Recargar datos
        } else {
          this.errorMessage = response.error || 'Error al agregar el registro';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error agregando registro:', error);
        this.errorMessage = `Error: ${error.message}`;
        this.isLoading = false;
      }
    });
  }

  validarRegistro(): boolean {
    if (!this.tablaActiva) return false;

    return this.tablaActiva.campos.every(campo =>
      !campo.requerido || (this.nuevoRegistro[campo.nombre] !== undefined && this.nuevoRegistro[campo.nombre] !== '')
    );
  }

  eliminarRegistro(registro: any) {
    if (!this.tablaActiva) return;

    const idField = this.getIdField();
    const id = registro[idField];

    if (id === undefined || id === null) {
      this.errorMessage = 'No se pudo obtener el ID del registro';
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.gestionService.eliminarRegistro(this.tablaActiva.nombre, id).subscribe({
        next: (response: GestionResponse) => {
          if (response.success) {
            this.successMessage = response.message || 'Registro eliminado exitosamente.';
            this.cargarDataTabla(); // Recargar datos
          } else {
            this.errorMessage = response.error || 'Error al eliminar el registro';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error eliminando registro:', error);
          this.errorMessage = error.message || 'Error de conexión al eliminar';
          this.isLoading = false;
        }
      });
    }
  }

  // Métodos auxiliares para IDs
  getNombreId(): string {
  if (!this.tablaActiva) return 'ID';
  const tablaBase = this.tablaActiva.nombre.split('_')[0];
  return 'ID_' + tablaBase;
}

getIdField(): string {
  if (!this.tablaActiva) return 'id';
  
  // CORREGIDO: Usar los nombres reales de campos ID según cada tabla
  switch(this.tablaActiva.nombre) {
    case 'UBICACION':
      return 'ID_UBI';
    case 'BARCO':
      return 'ID_BARCO';
    case 'MOLINO':
      return 'ID_MOLINO';
    case 'PROVEEDOR':
      return 'ID_PROV';
    case 'ESTADO':
      return 'ID_ESTADO';
    case 'PROCEDENCIA':
      return 'ID_PROCED';
    default:
      const tablaBase = this.tablaActiva.nombre.split('_')[0];
      return 'ID_' + tablaBase;
  }
}

getIdValor(registro: any): any {
  const idField = this.getIdField();
  const value = registro[idField];
  console.log(`Buscando campo ${idField} en registro:`, registro, 'Valor:', value);
  return value !== undefined && value !== null ? value : 'N/A';
}

  // Helper para obtener descripción de opciones en combos
  getDescripcionOpcion(campo: any, valor: any): string {
    if (!campo.opciones) return valor;
    const opcion = campo.opciones.find((o: any) => o.ID_PROCED == valor);
    return opcion ? opcion.DESC_PROCED : valor;
  }

  // Método para verificar si se puede eliminar un registro
  puedeEliminar(registro: any): boolean {
  const idField = this.getIdField();
  const id = registro[idField];
  console.log(`Verificando eliminación - Campo: ${idField}, ID:`, id);
  return id !== undefined && id !== null && id !== 'N/A';
}
}