import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnaliticaService, AnaliticaData, BobinaPopular } from '../../services/analitica.service';

// Importaciones para ng2-charts
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { 
  Chart, 
  BarController, 
  BarElement, 
  PieController, 
  ArcElement, 
  LineController, 
  LineElement, 
  PointElement, 
  CategoryScale, 
  LinearScale, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

// Registrar todos los componentes necesarios de Chart.js
Chart.register(
  BarController, 
  BarElement,
  PieController, 
  ArcElement,
  LineController, 
  LineElement, 
  PointElement,
  CategoryScale, 
  LinearScale,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

// Paleta de colores vibrantes
const COLOR_PALETTE = {
  primary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'],
  gradient: {
    blue: ['#3B82F6', '#60A5FA', '#93C5FD'],
    green: ['#10B981', '#34D399', '#6EE7B7'],
    purple: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
    orange: ['#F59E0B', '#FBBF24', '#FCD34D'],
    pink: ['#EC4899', '#F472B6', '#F9A8D4']
  }
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    BaseChartDirective
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'] 
})
export class Dashboard implements OnInit, OnDestroy {
  datos: AnaliticaData | null = null;
  isLoading = true;
  errorMessage = '';
  today = new Date();
  private animationFrame: any;

  // Estadísticas animadas
  stats = {
    totalBobinas: 0,
    bobinasDisponibles: 0,
    bobinasDespachadas: 0,
    tendenciaActual: 'estable'
  };

  // Configuración de gráficos MEJORADA con más colores
  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Bobinas Más Solicitadas',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.parsed.y} pedidos`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6B7280',
          maxRotation: 45
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6B7280',
          callback: (value) => {
            return Number(value).toLocaleString();
          }
        }
      }
    }
  };

  public barChartData: ChartData<'bar'> = {
    labels: ['Cargando...'],
    datasets: [
      {
        data: [0],
        label: 'Total Pedidos',
        backgroundColor: COLOR_PALETTE.primary,
        borderColor: COLOR_PALETTE.primary.map(color => color.replace('0.6', '1')),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: '📈 Tendencia de Pedidos - Último Año',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6B7280'
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6B7280',
          callback: (value) => {
            return Number(value).toLocaleString();
          }
        }
      }
    }
  };

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Cargando...'],
    datasets: [
      {
        data: [0],
        label: 'Pedidos Mensuales',
        fill: true,
        tension: 0.4,
        borderColor: COLOR_PALETTE.primary[0],
        backgroundColor: this.createGradient(COLOR_PALETTE.gradient.blue),
        pointBackgroundColor: COLOR_PALETTE.primary[0],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: COLOR_PALETTE.primary[0],
        pointHoverBorderWidth: 3
      }
    ]
  };

  public predictionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: '🤖 Predicción ML - Demanda Futura',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const pred = this.datos?.prediccionDemanda?.[context.dataIndex];
            const tendencia = pred?.tendencia === 'creciente' ? '📈' : pred?.tendencia === 'decreciente' ? '📉' : '➡️';
            return `${tendencia} ${context.dataset.label}: ${context.parsed.y} pedidos`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6B7280'
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: '#6B7280',
          callback: (value) => {
            return Number(value).toLocaleString();
          }
        }
      }
    }
  };

  public predictionChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Cargando...'],
    datasets: [
      {
        data: [0],
        label: 'Demanda Predicha',
        borderColor: COLOR_PALETTE.primary[1],
        backgroundColor: this.createGradient(COLOR_PALETTE.gradient.pink),
        fill: true,
        tension: 0.4,
        pointBackgroundColor: COLOR_PALETTE.primary[1],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: COLOR_PALETTE.primary[1],
        pointHoverBorderWidth: 3
      }
    ]
  };

  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateScale: true,
      animateRotate: true
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'bold'
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: '🎯 Estado Actual de Bobinas',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return ` ${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  public pieChartData: ChartData<'pie'> = {
    labels: ['Cargando...'],
    datasets: [
      {
        data: [100],
        backgroundColor: COLOR_PALETTE.primary,
        borderColor: '#fff',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverOffset: 8
      }
    ]
  };

  constructor(private analiticaService: AnaliticaService) {}

  ngOnInit() {
    this.cargarDatosAnalitica();
    this.iniciarAnimaciones();
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  // Crear gradientes para los gráficos
  private createGradient(colors: string[]): CanvasGradient {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return {} as CanvasGradient;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2]);
    
    return gradient;
  }

  // Animaciones para estadísticas
  private iniciarAnimaciones() {
    const animateValue = (start: number, end: number, duration: number, callback: (value: number) => void) => {
      const startTime = performance.now();
      
      const updateValue = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(start + (end - start) * easeOutQuart);
        
        callback(currentValue);
        
        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(updateValue);
        }
      };
      
      this.animationFrame = requestAnimationFrame(updateValue);
    };

    // Animar estadísticas cuando los datos estén listos
    if (this.datos) {
      animateValue(0, this.datos.estadisticas.totalBobinas, 2000, (value) => {
        this.stats.totalBobinas = value;
      });
      
      animateValue(0, this.datos.estadisticas.bobinasDisponibles, 2000, (value) => {
        this.stats.bobinasDisponibles = value;
      });
      
      animateValue(0, this.datos.estadisticas.bobinasDespachadas, 2000, (value) => {
        this.stats.bobinasDespachadas = value;
      });
    }
  }

  cargarDatosAnalitica() {
    this.isLoading = true;
    this.analiticaService.getAnaliticaPredictiva().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.datos = response.data;
          console.log('Datos ML recibidos:', this.datos.prediccionDemanda); // Debug ML
          this.actualizarGraficos();
          this.iniciarAnimaciones();
        } else {
          this.errorMessage = response.error || 'Error al cargar los datos';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.isLoading = false;
      }
    });
  }

  actualizarGraficos() {
    if (!this.datos) return;

    // Gráfico de barras - Bobinas populares
    if (this.datos.bobinasPopulares?.length > 0) {
      this.barChartData.labels = this.datos.bobinasPopulares.map(b => b.bobina);
      this.barChartData.datasets[0].data = this.datos.bobinasPopulares.map(b => b.total_pedidos);
    }

    // Gráfico de líneas - Tendencia mensual
    if (this.datos.tendenciaMensual?.length > 0) {
      this.lineChartData.labels = this.datos.tendenciaMensual.map(t => this.formatearMes(t.mes));
      this.lineChartData.datasets[0].data = this.datos.tendenciaMensual.map(t => t.total_pedidos);
    }

    // Gráfico de predicción ML - CORREGIDO
    if (this.datos.prediccionDemanda?.length > 0) {
      console.log('Datos de predicción ML:', this.datos.prediccionDemanda);
      this.predictionChartData.labels = this.datos.prediccionDemanda.map(p => this.formatearMes(p.mes));
      this.predictionChartData.datasets[0].data = this.datos.prediccionDemanda.map(p => p.demanda_predicha);
    } else {
      console.log('No hay datos de predicción ML disponibles');
      // Datos de ejemplo para debugging
      this.predictionChartData.labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      this.predictionChartData.datasets[0].data = [45, 52, 48, 55, 58, 62];
    }

    // Gráfico circular - Estado de bobinas
    if (this.datos.estadoBobinas?.length > 0) {
      this.pieChartData.labels = this.datos.estadoBobinas.map(e => e.estado);
      this.pieChartData.datasets[0].data = this.datos.estadoBobinas.map(e => e.cantidad);
    }

    // Forzar actualización
    setTimeout(() => {
      this.barChartData = { ...this.barChartData };
      this.lineChartData = { ...this.lineChartData };
      this.predictionChartData = { ...this.predictionChartData };
      this.pieChartData = { ...this.pieChartData };
    }, 500);
  }

  // Formatear meses para mejor visualización
  private formatearMes(mes: string): string {
    const [year, month] = mes.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(month) - 1]} ${year.slice(2)}`;
  }

  // SVG Icons dinámicos
  getStatIcon(stat: string): string {
    const icons: { [key: string]: string } = {
      total: `
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
      `,
      available: `
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      `,
      shipped: `
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-4a1 1 0 00-.293-.707l-4-4A1 1 0 0016 4H3z"/>
        </svg>
      `
    };
    return icons[stat] || icons.total;
  }

  getBobinaMasPopular(): BobinaPopular | null {
    return this.datos?.bobinasPopulares[0] || null;
  }

  getTendenciaActual(): string {
    const predicciones = this.datos?.prediccionDemanda;
    if (!predicciones || predicciones.length === 0) return 'estable';
    return predicciones[0]?.tendencia || 'estable';
  }

  getColorTendencia(): string {
    const tendencia = this.getTendenciaActual();
    switch(tendencia) {
      case 'creciente': return 'text-green-600 bg-green-100';
      case 'decreciente': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  }

    getIconoTendencia(): string {
      const tendencia = this.getTendenciaActual();
      switch(tendencia) {
        case 'creciente': 
          return `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>`;
        case 'decreciente': 
          return `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                  </svg>`;
        default: 
          return `<svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/>
                  </svg>`;
      }
    }
}