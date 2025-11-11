import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroService } from '../../services/registro.service';

interface MetricCard {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  isLoading = true;
  today = new Date();
  
  metricCards: MetricCard[] = [];
  
  // Datos para gráficos (simulados por ahora)
  stockData: ChartData = {
    labels: ['LAC 15', 'LAC 20', 'LAC 25', 'HR 30', 'HR 35'],
    datasets: [{
      label: 'Stock Actual',
      data: [150, 200, 175, 120, 90],
      backgroundColor: [
        'rgba(44, 90, 160, 0.8)',
        'rgba(52, 160, 164, 0.8)',
        'rgba(255, 107, 53, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(156, 39, 176, 0.8)'
      ],
      borderColor: [
        'rgba(44, 90, 160, 1)',
        'rgba(52, 160, 164, 1)',
        'rgba(255, 107, 53, 1)',
        'rgba(76, 175, 80, 1)',
        'rgba(156, 39, 176, 1)'
      ],
      borderWidth: 2
    }]
  };

  monthlyData: ChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [{
      label: 'Ingresos (tons)',
      data: [1200, 1900, 1500, 2100, 1800, 2200],
      backgroundColor: [
        'rgba(44, 90, 160, 0.2)',
        'rgba(44, 90, 160, 0.2)', 
        'rgba(44, 90, 160, 0.2)',
        'rgba(44, 90, 160, 0.2)',
        'rgba(44, 90, 160, 0.2)',
        'rgba(44, 90, 160, 0.2)'
      ],
      borderColor: [
        'rgba(44, 90, 160, 1)',
        'rgba(44, 90, 160, 1)',
        'rgba(44, 90, 160, 1)',
        'rgba(44, 90, 160, 1)',
        'rgba(44, 90, 160, 1)',
        'rgba(44, 90, 160, 1)'
      ],
      borderWidth: 3
    }]
  };

  // Datos para el gráfico de proveedores
  providerData: ChartData = {
    labels: ['Proveedor A', 'Proveedor B', 'Proveedor C', 'Proveedor D'],
    datasets: [{
      label: 'Pedidos por Proveedor',
      data: [45, 32, 28, 15],
      backgroundColor: [
        'rgba(44, 90, 160, 0.8)',
        'rgba(52, 160, 164, 0.8)',
        'rgba(255, 107, 53, 0.8)',
        'rgba(156, 39, 176, 0.8)'
      ],
      borderColor: [
        'rgba(44, 90, 160, 1)',
        'rgba(52, 160, 164, 1)',
        'rgba(255, 107, 53, 1)',
        'rgba(156, 39, 176, 1)'
      ],
      borderWidth: 2
    }]
  };

  constructor(private registroService: RegistroService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    
    // Cargar estadísticas del backend
    this.registroService.getEstadisticas().subscribe({
      next: (response) => {
        if (response.success) {
          this.updateMetricCards(response.data);
        } else {
          this.loadMockData();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando dashboard:', error);
        this.loadMockData();
        this.isLoading = false;
      }
    });
  }

  updateMetricCards(stats: any) {
    this.metricCards = [
      {
        title: 'Total Registros',
        value: stats.totalRegistros || 0,
        change: '+12%',
        isPositive: true,
        icon: '📊',
        color: 'blue'
      },
      {
        title: 'Stock Bobinas LAC 15',
        value: '150 tons',
        change: '+5%',
        isPositive: true,
        icon: '🏭',
        color: 'green'
      },
      {
        title: 'Stock Bobinas HR 30',
        value: '120 tons',
        change: '-2%',
        isPositive: false,
        icon: '🏗️',
        color: 'orange'
      },
      {
        title: 'Proveedores Activos',
        value: stats.totalProveedores || 0,
        change: '+3%',
        isPositive: true,
        icon: '👥',
        color: 'purple'
      },
      {
        title: 'Peso Total',
        value: stats.pesoTotal ? `${(stats.pesoTotal / 1000).toFixed(1)}K tons` : '0 tons',
        change: '+8%',
        isPositive: true,
        icon: '⚖️',
        color: 'red'
      },
      {
        title: 'Pedidos Pendientes',
        value: '24',
        change: '-5%',
        isPositive: true,
        icon: '📦',
        color: 'indigo'
      }
    ];
  }

  loadMockData() {
    this.metricCards = [
      {
        title: 'Total Registros',
        value: 156,
        change: '+12%',
        isPositive: true,
        icon: '📊',
        color: 'blue'
      },
      {
        title: 'Stock Bobinas LAC 15',
        value: '150 tons',
        change: '+5%',
        isPositive: true,
        icon: '🏭',
        color: 'green'
      },
      {
        title: 'Stock Bobinas HR 30',
        value: '120 tons',
        change: '-2%',
        isPositive: false,
        icon: '🏗️',
        color: 'orange'
      },
      {
        title: 'Proveedores Activos',
        value: 8,
        change: '+3%',
        isPositive: true,
        icon: '👥',
        color: 'purple'
      },
      {
        title: 'Peso Total Acumulado',
        value: '45.2K tons',
        change: '+8%',
        isPositive: true,
        icon: '⚖️',
        color: 'red'
      },
      {
        title: 'Pedidos Pendientes',
        value: '24',
        change: '-5%',
        isPositive: true,
        icon: '📦',
        color: 'indigo'
      }
    ];
  }

  getCardColorClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return colorMap[color] || 'from-gray-500 to-gray-600';
  }

  getCardBgClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      orange: 'bg-orange-50 border-orange-200',
      purple: 'bg-purple-50 border-purple-200',
      red: 'bg-red-50 border-red-200',
      indigo: 'bg-indigo-50 border-indigo-200'
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200';
  }

  // Método para calcular el porcentaje de progreso
  getProgressPercentage(value: number, max: number = 250): number {
    return (value / max) * 100;
  }
}