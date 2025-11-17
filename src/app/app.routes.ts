import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Datatables } from './components/datatables/datatables';
import { Pedidos } from './components/pedidos/pedidos';
import { Login } from './components/login/login';
import { authGuard } from './auth.guard';
import { DetallesPedido } from './components/detalles-pedido/detalles-pedido';

// Agregar si quieres una ruta específica, o dejarlo como componente modal
export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'detalles-pedido',component:DetallesPedido},
      { path: 'dashboard', component: Dashboard },
      { path: 'datatables', component: Datatables },
      { path: 'pedidos', component: Pedidos, canActivate: [authGuard] },
    ]
  }
];