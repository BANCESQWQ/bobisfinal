import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthMockService {
  private mockUser = {
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    initials: 'JP'
  };

  getCurrentUser(): any {
    return this.mockUser;
  }

  getUserName(): string {
    return this.mockUser.name;
  }

  getUserEmail(): string {
    return this.mockUser.email;
  }

  getUserInitials(): string {
    return this.mockUser.initials;
  }

  isAuthenticated(): boolean {
    return true; // Siempre autenticado para testing
  }

  logout(): void {
    console.log('Mock logout - Redirigiría al login real');
    // En producción, esto redirigiría a Azure AD
  }

  login(): void {
    console.log('Mock login - Redirigiría a Azure AD');
  }
}