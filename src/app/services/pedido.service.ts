import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

export interface PedidoCab {
  id_pedido: number;
  fecha_pedido: string;
  usuario_solicita_id: number;
  estado_pedido: string;
  observaciones: string;
  solicitante?: string;
  cant_bobinas?: number;
}
export interface PedidoPendiente {
  id_pedido: number;
  fecha_pedido: string;
  estado_pedido: string;
  observaciones: string;
  solicitante: string;
  bobinas_count: number;
  bobinas: any[];
}
export interface PedidoDet {
  id_pedido_det: number;
  id_pedido: number;
  id_registro: number;
}

export interface CrearPedidoRequest {
  usuario_solicita_id: number;
  observaciones: string;
  registros: number[];
}

export interface PedidosResponse {
  success: boolean;
  data: PedidoCab[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'http://localhost:5000/api';
private pedidosPendientesSource = new BehaviorSubject<PedidoPendiente[]>([]);
  pedidosPendientes$ = this.pedidosPendientesSource.asObservable();
  constructor(private http: HttpClient) {}
 agregarPedidoPendiente(pedido: PedidoPendiente) {
    const current = this.pedidosPendientesSource.value;
    this.pedidosPendientesSource.next([...current, pedido]);
  }

  // Método para remover pedido cuando se complete el checklist
  completarPedido(idPedido: number) {
    const current = this.pedidosPendientesSource.value;
    const updated = current.filter(p => p.id_pedido !== idPedido);
    this.pedidosPendientesSource.next(updated);
  }

  // Obtener pedidos pendientes
  getPedidosPendientes(): PedidoPendiente[] {
    return this.pedidosPendientesSource.value;
  }
  // Crear nuevo pedido
  crearPedido(pedidoData: CrearPedidoRequest): Observable<any> {
    console.log('Enviando pedido al backend:', pedidoData);
    
    return this.http.post(`${this.apiUrl}/pedidos`, pedidoData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en crearPedido:', error);
          if (error.status === 0) {
            // Error de conexión
            return throwError(() => new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.'));
          }
          return throwError(() => new Error(error.error?.error || error.message));
        })
      );
  }

  // Obtener historial de pedidos
  getHistorialPedidos(page: number = 1, perPage: number = 10, estado?: string): Observable<PedidosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (estado) {
      params = params.set('estado', estado);
    }

    return this.http.get<PedidosResponse>(`${this.apiUrl}/pedidos/historial`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener pedidos en curso (Borrador/Enviado)
  getPedidosEnCurso(): Observable<PedidosResponse> {
    return this.http.get<PedidosResponse>(`${this.apiUrl}/pedidos/en-curso`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en getPedidosEnCurso:', error);
          // Si falla, retornar respuesta vacía para que no rompa la UI
          return throwError(() => new Error('No se pudieron cargar los pedidos en curso'));
        })
      );
  }

  // Obtener detalle de un pedido específico
  getDetallePedido(idPedido: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pedidos/${idPedido}/detalle`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error en getDetallePedido:', error);
          // Retornar datos de ejemplo si el backend no responde
          const datosEjemplo = {
            success: true,
            data: []
          };
          return throwError(() => new Error('No se pudieron cargar los detalles del pedido'));
        })
      );
  }

  // Manejo de errores genérico
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
      if (error.error && error.error.error) {
        errorMessage += ` - ${error.error.error}`;
      }
    }
    
    console.error('Error en el servicio de pedidos:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}