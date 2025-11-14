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
    { label: 'Configuración', route: '/settings', isActive: false },
  ];

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