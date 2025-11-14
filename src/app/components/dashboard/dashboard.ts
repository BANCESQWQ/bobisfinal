import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../services/registro.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  currentDate: string = '';
  currentTime: string = '';
  
  // Estadísticas
  totalRegistros: number = 0;
  totalPeso: number = 0;
  pedidosActivos: number = 0;
  proveedoresCount: number = 0;
  isLoading: boolean = true;

  constructor(private registroService: RegistroService) {}

  ngOnInit() {
    this.updateDateTime();
    this.loadEstadisticas();
    
    // Actualizar cada minuto
    setInterval(() => this.updateDateTime(), 60000);
  }

  private updateDateTime() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    this.currentTime = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private loadEstadisticas() {
    this.isLoading = true;
    
    this.registroService.getEstadisticas().subscribe({
      next: (response) => {
        if (response.success) {
          this.totalRegistros = response.data.total_registros;
          this.totalPeso = response.data.total_peso;
          this.proveedoresCount = 12; // Valor por defecto por ahora
          this.pedidosActivos = 24; // Valor por defecto por ahora
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.isLoading = false;
      }
    });
  }
}