import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalService = inject(MsalService);

  // Obtener información del usuario logeado
  getCurrentUser(): AccountInfo | null {
    try {
      const accounts = this.msalService.instance.getAllAccounts();
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      return null;
    }
  }

  // Obtener nombre del usuario
  getUserName(): string {
    const user = this.getCurrentUser();
    return user?.name || 'Usuario';
  }

  // Obtener email del usuario
  getUserEmail(): string {
    const user = this.getCurrentUser();
    return user?.username || 'usuario@empresa.com';
  }

  // Obtener iniciales para el avatar
  getUserInitials(): string {
    const name = this.getUserName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Obtener departamento/rol (puedes personalizar según tu Azure AD)
  getUserDepartment(): string {
    const user = this.getCurrentUser();
    // Esto depende de cómo tengas configurado Azure AD
    return (user as any)?.idTokenClaims?.roles?.[0] || 'Usuario';
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Cerrar sesión
  logout(): void {
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: 'http://localhost:4200'
    });
  }

  // Login
  login(): void {
    this.msalService.loginRedirect();
  }
}