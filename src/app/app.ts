import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html', // Archivo HTML separado
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  isLoading = true;

  constructor(
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.authService.handleRedirectObservable().subscribe({
      next: (result) => {
        console.log('✅ Redirect manejado:', result);
        this.checkAuthAndNavigate();
      },
      error: (error) => {
        console.error('❌ Error en redirect:', error);
        this.checkAuthAndNavigate();
      },
      complete: () => {
        this.checkAuthAndNavigate();
      }
    });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None)
      )
      .subscribe(() => {
        this.checkAuthAndNavigate();
      });

    setTimeout(() => {
      if (this.isLoading) {
        this.isLoading = false;
      }
    }, 3000);
  }

  private checkAuthAndNavigate() {
    const accounts = this.authService.instance.getAllAccounts();

    if (accounts.length > 0) {
      this.authService.instance.setActiveAccount(accounts[0]);
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }

    this.isLoading = false;
  }
}