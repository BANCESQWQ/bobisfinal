import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  isLoggingIn = false;
  isCheckingAuth = true;

  constructor(
    private authService: MsalService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar autenticación con un pequeño delay para evitar flash
    setTimeout(() => {
      this.checkAuthentication();
    }, 100);
  }

  private checkAuthentication() {
    const accounts = this.authService.instance.getAllAccounts();

    if (accounts.length > 0) {
      this.authService.instance.setActiveAccount(accounts[0]);
      this.router.navigate(['/dashboard']);
    } else {
      this.isCheckingAuth = false;
    }
  }

  loginWithAzure() {
    this.isLoggingIn = true;
    
    // Pequeño delay para que se vea el loading
    setTimeout(() => {
      this.authService.loginRedirect();
    }, 500);
  }
}