import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface Pedido {
  id: number;
  numero_pedido: string;
  cliente: string;
  fecha_creacion: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'cancelado';
  total: number;
  items: PedidoItem[];
}

export interface PedidoItem {
  id: number;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss'
})
export class Pedidos implements OnInit {
  pedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  perPage: number = 10;
  totalPedidos: number = 0;
  
  // Estados para nuevo pedido
  showNuevoPedidoModal = false;
  nuevoPedido: Partial<Pedido> = {
    cliente: '',
    items: []
  };
  nuevoItem: Partial<PedidoItem> = {
    producto: '',
    cantidad: 1,
    precio_unitario: 0
  };

  ngOnInit() {
    this.cargarPedidosEjemplo();
  }

  cargarPedidosEjemplo() {
    // Datos de ejemplo
    this.pedidos = [
      {
        id: 1,
        numero_pedido: 'PED-2024-001',
        cliente: 'Cliente A',
        fecha_creacion: '2024-01-15',
        estado: 'pendiente',
        total: 1500.00,
        items: [
          { id: 1, producto: 'Bobina Acero 1m', cantidad: 2, precio_unitario: 500, subtotal: 1000 },
          { id: 2, producto: 'Bobina Aluminio 0.5m', cantidad: 1, precio_unitario: 500, subtotal: 500 }
        ]
      },
      {
        id: 2,
        numero_pedido: 'PED-2024-002',
        cliente: 'Cliente B',
        fecha_creacion: '2024-01-14',
        estado: 'procesando',
        total: 2750.00,
        items: [
          { id: 1, producto: 'Bobina Cobre 2m', cantidad: 1, precio_unitario: 1500, subtotal: 1500 },
          { id: 2, producto: 'Bobina Acero 1.5m', cantidad: 1, precio_unitario: 1250, subtotal: 1250 }
        ]
      }
    ];
    this.filteredPedidos = [...this.pedidos];
    this.totalPedidos = this.pedidos.length;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'procesando': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'completado': return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  getEstadoText(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'procesando': return 'Procesando';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  }

  abrirNuevoPedido() {
    this.showNuevoPedidoModal = true;
    this.nuevoPedido = {
      cliente: '',
      items: []
    };
  }

  agregarItem() {
    if (this.nuevoItem.producto && this.nuevoItem.cantidad && this.nuevoItem.precio_unitario) {
      const subtotal = this.nuevoItem.cantidad * this.nuevoItem.precio_unitario;
      const item: PedidoItem = {
        id: (this.nuevoPedido.items?.length || 0) + 1,
        producto: this.nuevoItem.producto!,
        cantidad: this.nuevoItem.cantidad!,
        precio_unitario: this.nuevoItem.precio_unitario!,
        subtotal: subtotal
      };
      
      this.nuevoPedido.items = [...(this.nuevoPedido.items || []), item];
      this.nuevoItem = { producto: '', cantidad: 1, precio_unitario: 0 };
    }
  }

  eliminarItem(index: number) {
    this.nuevoPedido.items?.splice(index, 1);
  }

  calcularTotal(): number {
    return this.nuevoPedido.items?.reduce((total, item) => total + item.subtotal, 0) || 0;
  }

  crearPedido() {
    if (this.nuevoPedido.cliente && this.nuevoPedido.items && this.nuevoPedido.items.length > 0) {
      const nuevoPedido: Pedido = {
        id: this.pedidos.length + 1,
        numero_pedido: `PED-2024-${String(this.pedidos.length + 1).padStart(3, '0')}`,
        cliente: this.nuevoPedido.cliente,
        fecha_creacion: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        total: this.calcularTotal(),
        items: this.nuevoPedido.items
      };

      this.pedidos.unshift(nuevoPedido);
      this.filteredPedidos = [...this.pedidos];
      this.showNuevoPedidoModal = false;
      
      alert('Pedido creado exitosamente!');
    }
  }
}