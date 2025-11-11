import { Component, OnInit } from '@angular/core';
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

  userName: string = 'Usuario';
  userEmail: string = 'usuario@empresa.com';
  userInitials: string = 'U';
  userDepartment: string = 'Departamento';

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

  logout() {
    this.authService.logout();
  }
}