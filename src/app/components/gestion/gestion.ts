import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Tabla {
  nombre: string;
  nombreDisplay: string;
  campos: Campo[];
  datos: any[];
}

interface Campo {
  nombre: string;
  tipo: string;
  requerido: boolean;
  display: string;
  opciones?: any[];
}

@Component({
  selector: 'app-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion.html',
  styleUrl: './gestion.scss'
})
export class Gestion implements OnInit {
  tablas: Tabla[] = [
    {
      nombre: 'UBICACION',
      nombreDisplay: 'Ubicaciones',
      campos: [
        { nombre: 'DESC_UBI', tipo: 'text', requerido: true, display: 'Descripción' }
      ],
      datos: []
    },
    {
      nombre: 'BARCO',
      nombreDisplay: 'Barcos',
      campos: [
        { nombre: 'NOMBRE_BARCO', tipo: 'text', requerido: true, display: 'Nombre' }
      ],
      datos: []
    },
    {
      nombre: 'MOLINO',
      nombreDisplay: 'Molinos',
      campos: [
        { nombre: 'NOMBRE_MOLINO', tipo: 'text', requerido: true, display: 'Nombre' },
        { 
          nombre: 'PROCEDENCIA_ID_PROCED', 
          tipo: 'select', 
          requerido: true, 
          display: 'Procedencia',
          opciones: [
            { ID_PROCED: 1, DESC_PROCED: 'Nacional' },
            { ID_PROCED: 2, DESC_PROCED: 'Importado' }
          ]
        }
      ],
      datos: []
    },
    {
      nombre: 'PROVEEDOR',
      nombreDisplay: 'Proveedores',
      campos: [
        { nombre: 'NOMBRE_PROV', tipo: 'text', requerido: true, display: 'Nombre' }
      ],
      datos: []
    },
    {
      nombre: 'ESTADO',
      nombreDisplay: 'Estados',
      campos: [
        { nombre: 'DESC_ESTADO', tipo: 'text', requerido: true, display: 'Descripción' }
      ],
      datos: []
    },
    {
      nombre: 'PROCEDENCIA',
      nombreDisplay: 'Procedencias',
      campos: [
        { nombre: 'DESC_PROCED', tipo: 'text', requerido: true, display: 'Descripción' }
      ],
      datos: []
    }
  ];

  tablaActiva: Tabla | null = null;
  datosTabla: any[] = [];
  nuevoRegistro: any = {};
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    if (this.tablas.length > 0) {
      this.cambiarTabla(this.tablas[0]);
    }
  }

  cambiarTabla(tabla: Tabla) {
    this.tablaActiva = tabla;
    this.nuevoRegistro = {};
    this.errorMessage = '';
    this.successMessage = '';
    this.cargarDataTabla();
  }

  cargarDataTabla() {
    if (!this.tablaActiva) return;

    this.isLoading = true;
    // Simular carga de datos reales
    setTimeout(() => {
      switch(this.tablaActiva?.nombre) {
        case 'UBICACION':
          this.datosTabla = [
            { ID_UBI: 1, DESC_UBI: 'Patio - Nave 1' },
            { ID_UBI: 2, DESC_UBI: 'Nave 2' },
            { ID_UBI: 3, DESC_UBI: 'Producción' },
            { ID_UBI: 4, DESC_UBI: 'Despacho' }
          ];
          break;
        case 'BARCO':
          this.datosTabla = [
            { ID_BARCO: 1, NOMBRE_BARCO: 'Pacífico I' },
            { ID_BARCO: 2, NOMBRE_BARCO: 'Atlántico II' }
          ];
          break;
        case 'MOLINO':
          this.datosTabla = [
            { ID_MOLINO: 1, NOMBRE_MOLINO: 'Molino Chimbote', PROCEDENCIA_ID_PROCED: 1 },
            { ID_MOLINO: 2, NOMBRE_MOLINO: 'Molino Brasil', PROCEDENCIA_ID_PROCED: 2 }
          ];
          break;
        case 'PROVEEDOR':
          this.datosTabla = [
            { ID_PROV: 1, NOMBRE_PROV: 'Aceros del Norte' },
            { ID_PROV: 2, NOMBRE_PROV: 'SiderPerú' }
          ];
          break;
        case 'ESTADO':
          this.datosTabla = [
            { ID_ESTADO: 1, DESC_ESTADO: 'En planta' },
            { ID_ESTADO: 2, DESC_ESTADO: 'Disponible' },
            { ID_ESTADO: 3, DESC_ESTADO: 'Despachada' }
          ];
          break;
        case 'PROCEDENCIA':
          this.datosTabla = [
            { ID_PROCED: 1, DESC_PROCED: 'Nacional' },
            { ID_PROCED: 2, DESC_PROCED: 'Importado' }
          ];
          break;
      }
      this.isLoading = false;
    }, 500);
  }

  agregarRegistro() {
    if (!this.tablaActiva || !this.validarRegistro()) {
      this.errorMessage = 'Por favor completa todos los campos requeridos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simular inserción
    setTimeout(() => {
      const nuevoId = this.datosTabla.length > 0 
        ? Math.max(...this.datosTabla.map(d => d[this.getIdField()])) + 1 
        : 1;
      
      const nuevoRegistro = {
        [this.getIdField()]: nuevoId,
        ...this.nuevoRegistro
      };

      this.datosTabla.push(nuevoRegistro);
      this.nuevoRegistro = {};
      this.isLoading = false;
      this.successMessage = 'Registro agregado exitosamente.';
    }, 500);
  }

  validarRegistro(): boolean {
    if (!this.tablaActiva) return false;

    return this.tablaActiva.campos.every(campo =>
      !campo.requerido || (this.nuevoRegistro[campo.nombre] !== undefined && this.nuevoRegistro[campo.nombre] !== '')
    );
  }

  eliminarRegistro(registro: any) {
    if (!this.tablaActiva) return;

    const id = registro[this.getIdField()];

    if (id === undefined || id === null) {
      this.errorMessage = 'No se pudo obtener el ID del registro';
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Simular eliminación
      setTimeout(() => {
        this.datosTabla = this.datosTabla.filter(
          d => d[this.getIdField()] !== id
        );
        this.isLoading = false;
        this.successMessage = 'Registro eliminado exitosamente.';
      }, 500);
    }
  }

  // Métodos auxiliares para IDs
  getNombreId(): string {
    if (!this.tablaActiva) return 'ID';
    const tablaBase = this.tablaActiva.nombre.split('_')[0];
    return `ID_${tablaBase}`;
  }

  getIdField(): string {
    if (!this.tablaActiva) return 'id';
    const tablaBase = this.tablaActiva.nombre.split('_')[0];
    return `ID_${tablaBase}`;
  }

  getIdValor(registro: any): any {
    const idField = this.getIdField();
    return registro[idField];
  }

  // Helper para obtener descripción de opciones en combos
  getDescripcionOpcion(campo: Campo, valor: any): string {
    if (!campo.opciones) return valor;
    const opcion = campo.opciones.find(o => o.ID_PROCED == valor);
    return opcion ? opcion.DESC_PROCED : valor;
  }
}