import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { from, switchMap } from 'rxjs';

export const msalInterceptor: HttpInterceptorFn = (req, next) => {
  const msalService = inject(MsalService);

  // Solo agregar token a requests a tu API
  if (req.url.includes('localhost:5000/api')) {
    return from(msalService.acquireTokenSilent({
      scopes: ['User.Read'],
      account: msalService.instance.getActiveAccount() || undefined
    })).pipe(
      switchMap((result: any) => {
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${result.accessToken}`
          }
        });
        return next(clonedRequest);
      })
    );
  }

  return next(req);
};