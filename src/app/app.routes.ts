import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Datatables } from './components/datatables/datatables';
import { Pedidos } from './components/pedidos/pedidos';
import { Login } from './components/login/login';
import { authGuard } from './auth.guard';
import { DetallesPedido } from './components/detalles-pedido/detalles-pedido';
import { HistorialDespachos } from './components/historial-despachos/historial-despachos';
import { ChecklistDespacho } from './components/checklist-despacho/checklist-despacho';
import { Gestion } from './components/gestion/gestion'; 

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'detalles-pedido', component: DetallesPedido },
      { path: 'dashboard', component: Dashboard },
      { path: 'datatables', component: Datatables },
      { path: 'pedidos', component: Pedidos, canActivate: [authGuard] },
      { path: 'historial-despachos', component: HistorialDespachos, canActivate: [authGuard] }, 
      { path: 'checklist-despacho', component: ChecklistDespacho, canActivate: [authGuard] }, 
      { path: 'gestion', component: Gestion, canActivate: [authGuard] } 
    ]
  }
];