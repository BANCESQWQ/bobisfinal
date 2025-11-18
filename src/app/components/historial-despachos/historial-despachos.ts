import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PedidoService } from 'src/app/services/pedido.service';

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

@Component({
  selector: 'app-historial-despachos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-despachos.html',
  styleUrl: './historial-despachos.scss'
})
export class HistorialDespachos implements OnInit {
  despachos: Despacho[] = [];
  filteredDespachos: Despacho[] = [];
  isLoading = true;
  searchTerm = "";
  
  // Propiedades para el modal
  selectedDespacho: Despacho | null = null;
  showDetailsModal = false;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.cargarDespachos();
  }

  cargarDespachos() {
    this.isLoading = true;
    // Simular carga de datos
    setTimeout(() => {
      const pedidosPendientes = this.pedidoService.getPedidosPendientes();
       this.despachos = pedidosPendientes.flatMap(pedido => 
        pedido.bobinas.map(bobina => ({
          id_pedido_det: bobina.id_pedido_det || 0,
          id_pedido: pedido.id_pedido,
          id_registro: bobina.id_registro,
          fecha_pedido: pedido.fecha_pedido,
          solicitante: pedido.solicitante,
          estado_pedido: pedido.estado_pedido,
          ped_observaciones: pedido.observaciones,
          estado_despacho: false, // Inicialmente pendiente
          pedido_compra: bobina.pedido_compra,
          colada: bobina.colada,
          peso: bobina.peso,
          bobina_desc: bobina.bobina_desc,
          proveedor_nombre: 'Proveedor por defecto', // Esto vendría de la BD
          fecha_despacho: '' // Se llenará cuando se complete el checklist
        }))
      );
      this.filteredDespachos = this.despachos;
      this.isLoading = false;
    }, 1000);
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
    this.showDetailsModal = true;
  }

  cerrarModal() {
    this.selectedDespacho = null;
    this.showDetailsModal = false;
  }

  // Exportar a PDF
  exportarPDF(despacho: Despacho) {
  const doc = new jsPDF();
  
  // Configuración del documento
  const fecha = new Date(despacho.fecha_pedido);
  const fechaFormateada = fecha.toLocaleDateString('es-ES');
  const titulo = `Despacho #${despacho.id_pedido} - ${fechaFormateada}`;
  
  // Título
  doc.setFontSize(18);
  doc.text(titulo, 14, 15);
  
  // Información del despacho
  doc.setFontSize(11);
  doc.text(`Solicitante: ${despacho.solicitante}`, 14, 25);
  doc.text(`Estado: ${despacho.estado_pedido}`, 14, 32);
  doc.text(`Observaciones: ${despacho.ped_observaciones || "Ninguna"}`, 14, 39);
  
  // Tabla de bobinas
  const tableColumns = ['Bobina', 'Peso (kg)', 'Peso (ton)'];
  const tableRows = [
    [
      despacho.bobina_desc,
      `${despacho.peso.toFixed(2)} kg`,
      `${(despacho.peso / 1000).toFixed(3)} ton`
    ]
  ];
  
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] }
  });
  
  // Total PESO EN TONELADAS (CORREGIDO)
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalToneladas = despacho.peso / 1000;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL PESO: ${totalToneladas.toFixed(3)} toneladas`, 14, finalY);
  
  // Información adicional
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Proveedor: ${despacho.proveedor_nombre}`, 14, finalY + 8);
  doc.text(`Colada: ${despacho.colada}`, 14, finalY + 14);
  doc.text(`Pedido Compra: ${despacho.pedido_compra}`, 14, finalY + 20);
  
  if (despacho.fecha_despacho) {
    const fechaDespacho = new Date(despacho.fecha_despacho).toLocaleDateString('es-ES');
    doc.text(`Fecha Despacho: ${fechaDespacho}`, 14, finalY + 26);
  }
  
  // Descargar PDF
  doc.save(`despacho-${despacho.id_pedido}-${fechaFormateada}.pdf`);
}
}