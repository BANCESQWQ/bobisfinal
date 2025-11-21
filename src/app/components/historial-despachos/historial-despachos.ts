import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Despacho {
  id_pedido_det: number;
  id_pedido: number;
  id_registro: number;
  fecha_pedido: string;
  solicitante: string;
  estado_pedido: string;
  ped_observaciones: string;
  estado_despacho: boolean;
  pedido_compra: string;
  colada: string;
  peso: number;
  bobina_desc: string;
  proveedor_nombre: string;
  fecha_despacho: string;
}

export interface DetallePedido {
  id_registro: number;
  id_pedido?: number; // Agregar esta propiedad opcional
  pedido_compra: string;
  colada: string;
  peso: number;
  cantidad: number;
  lote: string;
  cod_bobin2: string;
  desc_bobi: string;
  nombre_prov: string;
  fecha_ingreso_planta: string;
  estado_despacho?: boolean;
  bobina_desc?: string;
  proveedor_nombre?: string;
}

@Component({
  selector: 'app-historial-despachos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-despachos.html'
})
export class HistorialDespachos implements OnInit {
  despachos: Despacho[] = [];
  filteredDespachos: Despacho[] = [];
  detallesPedido: DetallePedido[] = [];
  isLoading = true;
  searchTerm = "";
  
  // Propiedades para el modal
  selectedDespacho: Despacho | null = null;
  showDetailsModal = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarDespachos();
  }

  cargarDespachos() {
    this.isLoading = true;
    
    this.http.get<any>('http://localhost:5000/api/despachos/historial').subscribe({
      next: (response) => {
        if (response.success) {
          this.despachos = response.data;
          this.filteredDespachos = this.despachos;
        } else {
          console.error('Error cargando despachos:', response.error);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en servicio:', error);
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros() {
    if (!this.searchTerm.trim()) {
      this.filteredDespachos = this.despachos;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredDespachos = this.despachos.filter(despacho =>
      despacho.pedido_compra.toLowerCase().includes(searchLower) ||
      despacho.colada.toLowerCase().includes(searchLower) ||
      despacho.bobina_desc.toLowerCase().includes(searchLower) ||
      despacho.proveedor_nombre.toLowerCase().includes(searchLower) ||
      despacho.solicitante.toLowerCase().includes(searchLower)
    );
  }

  getEstadoClass(estado: string): string {
    const statusMap: { [key: string]: string } = {
      'Atendido': 'bg-green-100 text-green-800 border-green-200',
      'Enviado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Borrador': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusMap[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getDespachoClass(estado: boolean): string {
    return estado 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }

  getDespachoText(estado: boolean): string {
    return estado ? 'Despachado' : 'Pendiente';
  }

  formatearFecha(fecha: string): string {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fecha;
    }
  }

  // Métodos para el modal
  verDetallesDespacho(despacho: Despacho) {
    this.selectedDespacho = despacho;
    this.cargarDetallesPedido(despacho.id_pedido);
    this.showDetailsModal = true;
  }

  cargarDetallesPedido(idPedido: number) {
    this.http.get<any>(`http://localhost:5000/api/pedidos/${idPedido}/detalle`).subscribe({
      next: (response) => {
        if (response.success) {
          this.detallesPedido = response.data;
        }
      },
      error: (error) => {
        console.error('Error cargando detalles:', error);
      }
    });
  }

  cerrarModal() {
    this.selectedDespacho = null;
    this.detallesPedido = [];
    this.showDetailsModal = false;
  }
  // Método para exportar a PDF mejorado
// Método para exportar a PDF corregido
exportarPDF(despacho: Despacho) {
  // Obtener todas las bobinas del pedido
  const bobinasDelPedido = this.despachos.filter(d => d.id_pedido === despacho.id_pedido);
  
  // Si no encontramos bobinas, usar solo la actual
  if (bobinasDelPedido.length === 0) {
    bobinasDelPedido.push(despacho);
  }
  
  this.generarPDFCompleto(despacho, bobinasDelPedido);
}

// Método separado para generar el PDF
generarPDFCompleto(despacho: Despacho, bobinasDelPedido: Despacho[]) {
  const doc = new jsPDF();
  
  // Configuración del documento
  const fecha = new Date(despacho.fecha_pedido);
  const fechaFormateada = fecha.toLocaleDateString('es-ES');
  
  // Título principal
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('REPORTE DE DESPACHO', 105, 20, { align: 'center' });
  
  // Línea decorativa
  doc.setDrawColor(66, 139, 202);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Información del despacho en dos columnas
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  
  // Columna izquierda
  doc.text(`N° Despacho: #${despacho.id_pedido}`, 20, 35);
  doc.text(`Fecha: ${fechaFormateada}`, 20, 42);
  doc.text(`Solicitante: ${despacho.solicitante}`, 20, 49);
  
  // Columna derecha
  doc.text(`Estado: ${despacho.estado_pedido}`, 110, 35);
  doc.text(`Despacho: ${this.getDespachoText(despacho.estado_despacho)}`, 110, 42);
  if (despacho.fecha_despacho) {
    doc.text(`Fecha Despacho: ${this.formatearFecha(despacho.fecha_despacho)}`, 110, 49);
  }
  
  // Observaciones
  let startY = 65;
  if (despacho.ped_observaciones && despacho.ped_observaciones.trim() !== '') {
    doc.text('Observaciones:', 20, 60);
    doc.setFontSize(10);
    const observaciones = doc.splitTextToSize(despacho.ped_observaciones, 170);
    doc.text(observaciones, 20, 67);
    startY = 80;
  }
  
  // Título de la tabla de bobinas
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('DETALLE DE BOBINAS DESPACHADAS', 105, startY, { align: 'center' });
  startY += 10;
  
  // Preparar datos para la tabla
  const tableColumns = [
    'N° Item',
    'Código Bobina', 
    'Pedido Compra',
    'Colada',
    'Peso (kg)',
    'Proveedor',
    'Estado'
  ];
  
  const tableRows = bobinasDelPedido.map((bobina, index) => [
    (index + 1).toString(),
    bobina.bobina_desc || 'N/A',
    bobina.pedido_compra || 'N/A',
    bobina.colada || 'N/A',
    bobina.peso ? `${bobina.peso.toFixed(2)}` : '0.00',
    bobina.proveedor_nombre || 'N/A',
    bobina.estado_despacho ? 'Despachado' : 'Pendiente'
  ]);
  
  // Calcular totales
  const totalPeso = bobinasDelPedido.reduce((sum, bobina) => sum + (bobina.peso || 0), 0);
  const totalBobinas = bobinasDelPedido.length;
  
  // Agregar fila de totales
  tableRows.push([
    '',
    `TOTAL: ${totalBobinas} bobina${totalBobinas !== 1 ? 's' : ''}`,
    '',
    '',
    `${totalPeso.toFixed(2)} kg`,
    '',
    ''
  ]);
  
  // Crear la tabla
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: startY,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.25,
      textColor: [0, 0, 0]
    },
    headStyles: { 
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    // Configuración para la última fila (totales)
    willDrawCell: (data) => {
      if (data.section === 'body' && data.row.index === tableRows.length - 1) {
        // Color de fondo para la fila de totales
        data.cell.styles.fillColor = [240, 249, 235];
        data.cell.styles.textColor = [21, 87, 36];
        data.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { top: startY }
  });
  
  // Información adicional después de la tabla
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de bobinas en el pedido: ${totalBobinas}`, 20, finalY);
  doc.text(`Peso total del despacho: ${totalPeso.toFixed(2)} kg`, 20, finalY + 6);
  doc.text(`Peso total en toneladas: ${(totalPeso / 1000).toFixed(3)} ton`, 20, finalY + 12);
  
  // Pie de página
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 105, pageHeight - 10, { align: 'center' });
  doc.text('Sistema BOBIS - Gestión de Bobinas', 105, pageHeight - 5, { align: 'center' });
  
  // Descargar PDF
  doc.save(`despacho-${despacho.id_pedido}-${fechaFormateada.replace(/\//g, '-')}.pdf`);
}
}