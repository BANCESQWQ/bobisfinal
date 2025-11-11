import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header'; // ← Importar Header
import { Dashboard } from '../../components/dashboard/dashboard'; // ← Importar Dashboard

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, Header, Dashboard], // ← Agregar ambos componentes
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss'
})
export class DashboardPage { }