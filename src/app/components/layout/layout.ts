import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { RouterModule, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, Header, Sidebar, RouterModule],
  templateUrl: './layout.html',
  template: `
    <div class="flex h-screen bg-gray-50">
      <app-sidebar class="flex-shrink-0"></app-sidebar>
      
      <div class="flex-1 flex flex-col overflow-hidden">
        <app-header></app-header>
        
        <main class="flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrl: './layout.scss'
})
export class Layout implements OnInit {
  isAuthenticated = false;
  isMobileMenuOpen = false;

  constructor(
    private authService: MsalService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar autenticación al cargar el layout
    const accounts = this.authService.instance.getAllAccounts();
    this.isAuthenticated = accounts.length > 0;
    
    if (!this.isAuthenticated) {
      console.log('⚠️ Layout: Usuario no autenticado, redirigiendo...');
      this.router.navigate(['/login']);
    } else {
      console.log('✅ Layout: Usuario autenticado, mostrando interfaz');
    }
  }

  // Manejar el toggle del menú móvil desde el header
  onMobileMenuToggled() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Cerrar menú móvil desde el sidebar
  onMobileMenuClosed() {
    this.isMobileMenuOpen = false;
  }
}