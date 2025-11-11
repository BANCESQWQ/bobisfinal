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
  tcn_pedido_compra: number;
  fecha_ingreso_planta: string;
  bobina_id_bobi: number;
  proveedor_id_prov: number;
  barco_id_barco: number;
  ubicacion_id_ubi: number;
  estado_id_estado: number;
  molino_id_molino: number;
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

  // Adaptar la respuesta del backend a la estructura que espera Angular
  private adaptResponse(response: BackendResponse, page: number, perPage: number): RegistrosResponse {
    console.log('🔄 Procesando respuesta del backend:', response);

    // Mapear los campos del backend a la interfaz Registro
    const registros: Registro[] = response.data.map((item: any) => {
      console.log('📦 Item recibido:', item);
      
      return {
        id_registro: item.ID_REGISTRO || item.id_registro || 0,
        fecha_llegada: item.FECHA_LLEGADA || item.fecha_llegada || '',
        pedido_compra: item.PEDIDO_COMPRA || item.pedido_compra || '',
        colada: item.COLADA || item.colada || '',
        peso: this.parseFloatSafe(item.PESO || item.peso),
        cantidad: item.CANTIDAD || item.cantidad || 0,
        lote: item.LOTE || item.lote || 0,
        fecha_inventario: item.FECHA_INVENTARIO || item.fecha_inventario || '',
        observaciones: item.OBSERVACIONES || item.observaciones || '',
        tcn_pedido_compra: this.parseFloatSafe(item.TCN_PEDIDO_COMPRA || item.tcn_pedido_compra),
        fecha_ingreso_planta: item.FECHA_INGRESO_PLANTA || item.fecha_ingreso_planta || '',
        bobina_id_bobi: item.BOBINA_ID_BOBI || item.bobina_id_bobi || 0,
        proveedor_id_prov: item.PROVEEDOR_ID_PROV || item.proveedor_id_prov || 0,
        barco_id_barco: item.BARCO_ID_BARCO || item.barco_id_barco || 0,
        ubicacion_id_ubi: item.UBICACION_ID_UBI || item.ubicacion_id_ubi || 0,
        estado_id_estado: item.ESTADO_ID_ESTADO || item.estado_id_estado || 0,
        molino_id_molino: item.MOLINO_ID_MOLINO || item.molino_id_molino || 0
      };
    });

    // Calcular total de forma segura
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

  // Obtener tablas disponibles
  getTablas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tablas`)
      .pipe(
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