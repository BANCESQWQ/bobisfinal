import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

export const authGuard: CanActivateFn = (route, state) => {
  const msalService = inject(MsalService);
  const router = inject(Router);

  const accounts = msalService.instance.getAllAccounts();
  
  if (accounts.length > 0) {
    return true;
  } else {
    // Redirigir al login
    router.navigate(['/login']);
    return false;
  }
};