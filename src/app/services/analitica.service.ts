import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface BobinaPopular {
  bobina: string;
  total_pedidos: number;
  peso_promedio: number;
}

export interface EstadoBobina {
  estado: string;
  cantidad: number;
}

export interface TendenciaMensual {
  mes: string;
  total_pedidos: number;
  peso_total: number;
}

export interface PrediccionDemanda {
  mes: string;
  demanda_predicha: number;
  tendencia: string;
}

export interface BobinaAntigua {
  id_registro: number;
  bobina: string;
  fecha_ingreso: string;
  peso: number;
  estado: string;
  dias_inventario: number;
}

export interface AnaliticaData {
  bobinasPopulares: BobinaPopular[];
  estadoBobinas: EstadoBobina[];
  bobinasAntiguas: BobinaAntigua[];
  tendenciaMensual: TendenciaMensual[];
  prediccionDemanda: PrediccionDemanda[];
  estadisticas: {
    totalBobinas: number;
    bobinasDisponibles: number;
    bobinasDespachadas: number;
  };
}

export interface AnaliticaResponse {
  success: boolean;
  data: AnaliticaData;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnaliticaService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getAnaliticaPredictiva(): Observable<AnaliticaResponse> {
    return this.http.get<AnaliticaResponse>(`${this.apiUrl}/dashboard/analitica-predictiva`)
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
    console.error('Error en servicio de analítica:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}