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
  opciones?: any[];
}

export interface GestionResponse {
  success: boolean;
  data: any[];
  message?:string;
  error?: string;
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
        { nombre: 'DESC_UBI', tipo: 'text', requerido: true, display: 'Descripción' }
      ]
    },
    {
      nombre: 'BARCO',
      nombreDisplay: 'Barcos',
      campos: [
        { nombre: 'NOMBRE_BARCO', tipo: 'text', requerido: true, display: 'Nombre' }
      ]
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
          display: 'Procedencia'
        }
      ]
    },
    {
      nombre: 'PROVEEDOR',
      nombreDisplay: 'Proveedores',
      campos: [
        { nombre: 'NOMBRE_PROV', tipo: 'text', requerido: true, display: 'Nombre' }
      ]
    },
    {
      nombre: 'ESTADO',
      nombreDisplay: 'Estados',
      campos: [
        { nombre: 'DESC_ESTADO', tipo: 'text', requerido: true, display: 'Descripción' }
      ]
    },
    {
      nombre: 'PROCEDENCIA',
      nombreDisplay: 'Procedencias',
      campos: [
        { nombre: 'DESC_PROCED', tipo: 'text', requerido: true, display: 'Descripción' }
      ]
    }
  ];

  constructor(private http: HttpClient) {}

  // Obtener datos de una tabla específica
  getDataTabla(tabla: string): Observable<GestionResponse> {
    return this.http.get<GestionResponse>(`${this.apiUrl}/gestion/${tabla}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Agregar registro a una tabla
  agregarRegistro(tabla: string, datos: any): Observable<GestionResponse> {
    return this.http.post<GestionResponse>(`${this.apiUrl}/gestion/${tabla}`, datos)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Eliminar registro de una tabla
  eliminarRegistro(tabla: string, id: number): Observable<GestionResponse> {
    return this.http.delete<GestionResponse>(`${this.apiUrl}/gestion/${tabla}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener opciones para combos (procedencias para molinos)
  getOpcionesProcedencias(): Observable<GestionResponse> {
    return this.http.get<GestionResponse>(`${this.apiUrl}/gestion/PROCEDENCIA`)
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