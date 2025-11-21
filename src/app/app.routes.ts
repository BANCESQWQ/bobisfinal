import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Dashboard } from './components/dashboard/dashboard';
import { Datatables } from './components/datatables/datatables';
import { Pedidos } from './components/pedidos/pedidos';
import { Login } from './components/login/login';
import { AuthGuard } from './auth.guard';
import { DetallesPedido } from './components/detalles-pedido/detalles-pedido';
import { HistorialDespachos } from './components/historial-despachos/historial-despachos';
import { ChecklistDespacho } from './components/checklist-despacho/checklist-despacho';
import { Gestion } from './components/gestion/gestion'; 
import { IngresoBobinas } from './components/ingreso-bobinas/ingreso-bobinas';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Layout,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'pedidos', component: Pedidos },
      { path: 'checklist-despacho', component: ChecklistDespacho },
      { path: 'historial-despachos', component: HistorialDespachos },
      { path: 'detalles-pedido', component: DetallesPedido },
      { path: 'datatables', component: Datatables },
      { path: 'gestion', component: Gestion },
      { path: 'ingreso-bobinas', component: IngresoBobinas },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];