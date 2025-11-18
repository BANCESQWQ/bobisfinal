import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface TablaGestion {
  nombre: string;
  nombreDisplay: string;
  campos: CampoGestion[];
}

export interface CampoGestion {
  nombre: string;
  tipo: string;
  requerido: boolean;
  display: string;
}

export interface RegistroGestion {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class GestionService {
  private apiUrl = 'http://localhost:5000/api';

  tablas: TablaGestion[] = [
    {
      nombre: 'UBICACION',
      nombreDisplay: 'Ubicaciones',
      campos: [
        { nombre: 'desc_ubi', tipo: 'text', requerido: true, display: 'Descripción' }
      ]
    },
    {
      nombre: 'BARCO',
      nombreDisplay: 'Barcos',
      campos: [
        { nombre: 'nombre_barco', tipo: 'text', requerido: true, display: 'Nombre' }
      ]
    },
    {
      nombre: 'MOLINO',
      nombreDisplay: 'Molinos',
      campos: [
        { nombre: 'nombre_molino', tipo: 'text', requerido: true, display: 'Nombre' },
        { nombre: 'procedencia_id_proced', tipo: 'number', requerido: true, display: 'ID Procedencia' }
      ]
    },
    {
      nombre: 'PROVEEDOR',
      nombreDisplay: 'Proveedores',
      campos: [
        { nombre: 'nombre_prov', tipo: 'text', requerido: true, display: 'Nombre' }
      ]
    },
    {
      nombre: 'ESTADO',
      nombreDisplay: 'Estados',
      campos: [
        { nombre: 'desc_estado', tipo: 'text', requerido: true, display: 'Descripción' }
      ]
    },
    {
      nombre: 'PROCEDENCIA',
      nombreDisplay: 'Procedencias',
      campos: [
        { nombre: 'desc_proced', tipo: 'text', requerido: true, display: 'Descripción' }
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  // Obtener datos de una tabla
  getDatosTabla(tabla: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/gestion/${tabla}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Agregar registro a una tabla
  agregarRegistro(tabla: string, datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/gestion/${tabla}`, datos)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Eliminar registro de una tabla
  eliminarRegistro(tabla: string, id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/gestion/${tabla}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
      if (error.error && error.error.error) {
        errorMessage += ` - ${error.error.error}`;
      }
    }
    console.error('Error en el servicio de gestión:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}