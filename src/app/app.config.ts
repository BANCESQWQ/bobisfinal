import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { msalInterceptor } from './msal.interceptor';

// MSAL imports
import { MsalModule, MsalGuard, MsalRedirectComponent } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';

// Reemplaza con tus valores reales de Azure AD
const msalConfig = {
  auth: {
    clientId: '983f24a9-50af-4576-a1b3-09590ae396e1',
    authority: 'https://login.microsoftonline.com/b4a40545-7779-4b38-aff7-1f1738f80840',
    redirectUri: 'http://localhost:4200'
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

const loginRequest = {
  scopes: ['User.Read']
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([msalInterceptor])
    ),
    importProvidersFrom(
      MsalModule.forRoot(
  new PublicClientApplication(msalConfig),
  {
    // Para el guard / login
    interactionType: InteractionType.Popup,
    authRequest: loginRequest
  },
  {
    // Para el interceptor de MSAL (si algún día lo usas)
    interactionType: InteractionType.Popup,
    protectedResourceMap: new Map([
      ['https://graph.microsoft.com/v1.0/me', ['User.Read']]
    ])
  }
)

    ),
    MsalGuard,
    MsalRedirectComponent
  ]
};