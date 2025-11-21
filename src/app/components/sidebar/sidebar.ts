import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  route: string;
  isActive: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  @Input() isMobileMenuOpen: boolean = false;
  @Output() mobileMenuClosed = new EventEmitter<void>();
  
  isSidebarOpen = true;

  menuItems: MenuItem[] = [
  { label: 'Dashboard', route: '/dashboard', isActive: true },
  { label: 'Registros', route: '/datatables', isActive: false },
  { label: 'Pedidos', route: '/pedidos', isActive: false },
  { label: 'Checklist Despacho', route: '/checklist-despacho', isActive: false },
  { label: 'Historial Despachos', route: '/historial-despachos', isActive: false },
  { label: 'Gestión', route: '/gestion', isActive: false },
];
 toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Si estamos abriendo el menú móvil, también abrimos el sidebar
    if (this.isMobileMenuOpen) {
      this.isSidebarOpen = true;
    }
  }
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  setActiveItem(clickedItem: MenuItem) {
    this.menuItems.forEach(item => {
      item.isActive = item.label === clickedItem.label;
    });
    
    // En móvil, cerrar el sidebar después de hacer click
    if (window.innerWidth < 1024) {
      this.closeMobileMenu();
    }
  }

  // Cerrar sidebar en móvil cuando se hace click fuera
  closeMobileMenu() {
    this.mobileMenuClosed.emit();
  }

  // Cerrar sidebar en móvil cuando se hace click en un link
  onLinkClick() {
    if (window.innerWidth < 1024) {
      this.closeMobileMenu();
    }
  }
}