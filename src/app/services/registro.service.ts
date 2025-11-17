import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';

export interface Registro {
  id_registro: number;
  fecha_llegada: string;
  pedido_compra: string;
  colada: string;
  peso: number;
  cantidad: number;
  lote: number;
  fecha_inventario: string;
  observaciones: string;
  ton_pedido_compra: number;
  fecha_ingreso_planta: string;
  bobina_id_bobi: number;
  bobina_desc: string;
  proveedor_id_prov: number;
  proveedor_nombre: string;
  barco_id_barco: number;
  barco_nombre: string;
  ubicacion_id_ubi: number;
  ubicacion_desc: string;
  estado_id_estado: number;
  estado_desc: string;
  molino_id_molino: number;
  molino_nombre: string;
  n_bobi_proveedor: string;
  bobi_correlativo: number;
  cod_bobin2?: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
}

export interface Bobina {
  id: number;
  descripcion: string;
  laminacion: string;
  espesor: number;
  ancho: number;
}

export interface Estado {
  id: number;
  descripcion: string;
}

export interface Ubicacion {
  id: number;
  descripcion: string;
}

export interface RegistrosResponse {
  success: boolean;
  data: Registro[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

export interface BackendResponse {
  success: boolean;
  data: any[];
  total?: number;
  pagination?: {
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Obtener todos los registros con paginación
  getRegistros(page: number = 1, perPage: number = 10, search: string = ''): Observable<RegistrosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<BackendResponse>(`${this.apiUrl}/registros`, { params })
      .pipe(
        map(response => this.adaptResponse(response, page, perPage)),
        catchError(this.handleError)
      );
  }

  // Obtener proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<any>(`${this.apiUrl}/proveedores`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Obtener bobinas
  getBobinas(): Observable<Bobina[]> {
    return this.http.get<any>(`${this.apiUrl}/bobinas`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Obtener estados
  getEstados(): Observable<Estado[]> {
    return this.http.get<any>(`${this.apiUrl}/estados`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Obtener ubicaciones
  getUbicaciones(): Observable<Ubicacion[]> {
    return this.http.get<any>(`${this.apiUrl}/ubicaciones`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Obtener estadísticas
  getEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Adaptar la respuesta del backend a la estructura que espera Angular
  private adaptResponse(response: BackendResponse, page: number, perPage: number): RegistrosResponse {
    console.log('🔄 Procesando respuesta del backend:', response);

    // Mapear los campos del backend a la interfaz Registro
    const registros: Registro[] = response.data.map((item: any) => {
      return {
        id_registro: item.id_registro || 0,
        fecha_llegada: item.fecha_llegada || '',
        pedido_compra: item.pedido_compra || '',
        colada: item.colada || '',
        peso: this.parseFloatSafe(item.peso),
        cantidad: item.cantidad || 0,
        lote: item.lote || 0,
        fecha_inventario: item.fecha_inventario || '',
        observaciones: item.observaciones || '',
        ton_pedido_compra: this.parseFloatSafe(item.ton_pedido_compra),
        fecha_ingreso_planta: item.fecha_ingreso_planta || '',
        bobina_id_bobi: item.bobina_id_bobi || 0,
        bobina_desc: item.bobina_desc || 'Sin información',
        proveedor_id_prov: item.proveedor_id_prov || 0,
        proveedor_nombre: item.proveedor_nombre || 'Sin proveedor',
        barco_id_barco: item.barco_id_barco || 0,
        barco_nombre: item.barco_nombre || 'Sin barco',
        ubicacion_id_ubi: item.ubicacion_id_ubi || 0,
        ubicacion_desc: item.ubicacion_desc || 'Sin ubicación',
        estado_id_estado: item.estado_id_estado || 0,
        estado_desc: item.estado_desc || 'Sin estado',
        molino_id_molino: item.molino_id_molino || 0,
        molino_nombre: item.molino_nombre || 'Sin molino',
        n_bobi_proveedor: item.n_bobi_proveedor || '',
        bobi_correlativo: item.bobi_correlativo || 0,
        cod_bobin2: item.cod_bobin2 || undefined // ✅ Agregar este campo
      };
    });

    const total = response.total || response.pagination?.total || registros.length;
    const pages = Math.ceil(total / perPage);

    console.log('✅ Respuesta adaptada:', {
      registrosCount: registros.length,
      total: total,
      pages: pages,
      primerRegistro: registros[0]
    });

    return {
      success: response.success,
      data: registros,
      pagination: {
        page: page,
        per_page: perPage,
        total: total,
        pages: pages
      }
    };
  }

  // Helper para parsear números de forma segura
  private parseFloatSafe(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Probar conexión a la base de datos
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-db`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Manejo de errores
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
    console.error('Error en el servicio:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}