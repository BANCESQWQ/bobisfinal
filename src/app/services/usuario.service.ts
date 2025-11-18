import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';

export interface Usuario {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  correo_usuario: string;
  azure_object_id: string;
  rol_usuario: string;
  estado: string;
  fecha_ultimo_acceso: string;
  fecha_creacion: string;
}

export interface UsuariosResponse {
  success: boolean;
  data: Usuario[];
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getUsuarios(): Observable<UsuariosResponse> {
    return this.http.get<UsuariosResponse>(`${this.apiUrl}/usuarios`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener usuario por ID
  getUsuarioById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener usuario por Azure Object ID
  getUsuarioByAzureId(azureId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios/azure/${azureId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Crear o actualizar usuario desde Azure AD
  sincronizarUsuario(usuarioData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios/sincronizar`, usuarioData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Actualizar rol de usuario
  actualizarRolUsuario(id: number, nuevoRol: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}/rol`, { rol: nuevoRol })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Obtener roles disponibles
  getRolesDisponibles(): string[] {
    return ['Administrador', 'Supervisor', 'Operador', 'Despacho', 'Consulta'];
  }

  // Verificar permisos por rol
  tienePermiso(rolUsuario: string, permisosRequeridos: string[]): boolean {
    const permisosPorRol: { [key: string]: string[] } = {
      'Administrador': ['crear', 'editar', 'eliminar', 'aprobar', 'despachar', 'consultar'],
      'Supervisor': ['crear', 'editar', 'aprobar', 'despachar', 'consultar'],
      'Despacho': ['despachar', 'consultar'],
      'Operador': ['crear', 'consultar'],
      'Consulta': ['consultar']
    };

    const permisosDelUsuario = permisosPorRol[rolUsuario] || [];
    return permisosRequeridos.some(permiso => permisosDelUsuario.includes(permiso));
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
    console.error('Error en el servicio de usuarios:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}