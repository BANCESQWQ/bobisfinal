import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, // ✅ ¡IMPORTANTE! Agregar esto
    RouterModule   // ✅ Para router-outlet
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div *ngIf="isLoading" class="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
      <router-outlet *ngIf="!isLoading"></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: MsalService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // Esperar a que MSAL complete el manejo de redirección
      await firstValueFrom(this.authService.handleRedirectObservable());
      
      // Verificar autenticación una sola vez
      const accounts = this.authService.instance.getAllAccounts();
      
      if (accounts.length > 0) {
        await this.router.navigate(['/dashboard']);
      } else {
        await this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      await this.router.navigate(['/login']);
    } finally {
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}