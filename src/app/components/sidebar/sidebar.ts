import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
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
  isSidebarOpen = true;
  isMobileMenuOpen = false;

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard', isActive: true },
    { label: 'Registros', icon: '📋', route: '/datatables', isActive: false },
    { label: 'Pedidos', icon: '🛒', route: '/pedidos', isActive: false }, // ← Nuevo item
    { label: 'Configuración', icon: '⚙️', route: '/settings', isActive: false },
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  setActiveItem(clickedItem: MenuItem) {
    this.menuItems.forEach(item => {
      item.isActive = item.label === clickedItem.label;
    });
  }
}