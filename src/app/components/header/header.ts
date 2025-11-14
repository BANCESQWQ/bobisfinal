import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  isProfileMenuOpen = false;
  isNotificationMenuOpen = false;

  // Información del usuario
  userName: string = 'Usuario';
  userEmail: string = 'usuario@empresa.com';
  userInitials: string = 'U';
  userDepartment: string = 'Departamento';

  // Evento para abrir/cerrar sidebar en móvil
  @Output() mobileMenuToggled = new EventEmitter<void>();

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    if (this.authService.isAuthenticated()) {
      this.userName = this.authService.getUserName();
      this.userEmail = this.authService.getUserEmail();
      this.userInitials = this.authService.getUserInitials();
      this.userDepartment = this.authService.getUserDepartment();
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isNotificationMenuOpen = false;
  }

  toggleNotificationMenu() {
    this.isNotificationMenuOpen = !this.isNotificationMenuOpen;
    this.isProfileMenuOpen = false;
  }

  // Nueva función para menú móvil
  toggleMobileMenu() {
    this.mobileMenuToggled.emit();
  }

  logout() {
    this.authService.logout();
  }
}