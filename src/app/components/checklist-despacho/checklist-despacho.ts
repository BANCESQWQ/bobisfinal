import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, PedidoPendiente } from '../../services/pedido.service';

interface BobinaDespacho {
  id_registro: number;
  id_pedido_det: number;
  bobina_desc: string;
  pedido_compra: string;
  colada: string;
  peso: number;
  seleccionada: boolean;
}

@Component({
  selector: 'app-checklist-despacho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checklist-despacho.html',
  styleUrl: './checklist-despacho.scss'
})
export class ChecklistDespacho implements OnInit {
  // Panel izquierdo: Lista de pedidos pendientes
  pedidosPendientes: PedidoPendiente[] = [];
  
  // Panel derecho: Pedido seleccionado y sus bobinas
  pedidoSeleccionado: PedidoPendiente | null = null;
  bobinasPedido: BobinaDespacho[] = [];
  
  // Estados
  isLoading = true;
  showConfirmModal = false;

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.cargarPedidosPendientes();
  }

  // GETTER para contar bobinas seleccionadas
  get bobinasSeleccionadasCount(): number {
    return this.bobinasPedido.filter(b => b.seleccionada).length;
  }

  // GETTER para verificar si todas están seleccionadas
  get todasBobinasSeleccionadas(): boolean {
    return this.bobinasPedido.length > 0 && 
           this.bobinasPedido.every(b => b.seleccionada);
  }

  // GETTER para verificar si alguna está seleccionada
  get algunaBobinaSeleccionada(): boolean {
    return this.bobinasPedido.some(b => b.seleccionada);
  }

  cargarPedidosPendientes() {
    this.isLoading = true;
    // Usar datos reales del servicio
    setTimeout(() => {
      this.pedidosPendientes = this.pedidoService.getPedidosPendientes();
      this.isLoading = false;
      
      // También suscribirse a cambios futuros
      this.pedidoService.pedidosPendientes$.subscribe(pedidos => {
        this.pedidosPendientes = pedidos;
      });
    }, 1000);
  }

  seleccionarPedido(pedido: PedidoPendiente) {
    this.pedidoSeleccionado = { ...pedido };
    this.cargarBobinasPedido(pedido.id_pedido);
  }

  cargarBobinasPedido(idPedido: number) {
    // Buscar el pedido en la lista para obtener sus bobinas reales
    const pedido = this.pedidosPendientes.find(p => p.id_pedido === idPedido);
    if (pedido && pedido.bobinas) {
      this.bobinasPedido = pedido.bobinas.map(bobina => ({
        ...bobina,
        seleccionada: false
      }));
    } else {
      // Datos de ejemplo si no hay bobinas en el pedido
      this.bobinasPedido = [
        {
          id_registro: 1,
          id_pedido_det: 1,
          bobina_desc: 'Bobina HR SAE1006',
          pedido_compra: 'PO-1001',
          colada: 'COL001',
          peso: 2420.35,
          seleccionada: false
        },
        {
          id_registro: 2,
          id_pedido_det: 2,
          bobina_desc: 'Bobina CR SAE1008',
          pedido_compra: 'PO-1001',
          colada: 'COL002',
          peso: 1985.70,
          seleccionada: false
        }
      ];
    }
  }

  toggleSeleccionBobina(bobina: BobinaDespacho) {
    bobina.seleccionada = !bobina.seleccionada;
  }

  confirmarDespacho() {
    if (!this.todasBobinasSeleccionadas) {
      alert('Debes seleccionar TODAS las bobinas para confirmar el despacho.');
      return;
    }
    this.showConfirmModal = true;
  }

  ejecutarConfirmacion() {
    if (this.pedidoSeleccionado) {
      // Notificar al servicio que se completó el pedido
      this.pedidoService.completarPedido(this.pedidoSeleccionado.id_pedido);
      
      // Aquí iría la llamada al backend para confirmar el despacho
      console.log('Despacho confirmado:', this.pedidoSeleccionado);
      
      // Remover pedido de la lista local
      this.pedidosPendientes = this.pedidosPendientes.filter(
        p => p.id_pedido !== this.pedidoSeleccionado?.id_pedido
      );
      
      this.showConfirmModal = false;
      this.pedidoSeleccionado = null;
      this.bobinasPedido = [];
      
      alert('✅ Despacho confirmado exitosamente.');
    }
  }

  cancelarConfirmacion() {
    this.showConfirmModal = false;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClass(estado: string): string {
    const statusMap: { [key: string]: string } = {
      'Enviado': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Borrador': 'bg-gray-100 text-gray-800 border-gray-200',
      'Atendido': 'bg-green-100 text-green-800 border-green-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusMap[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  calcularPesoTotal(): number {
    return this.bobinasPedido.reduce((total, bobina) => total + bobina.peso, 0);
  }

  calcularPesoSeleccionado(): number {
    return this.bobinasPedido
      .filter(b => b.seleccionada)
      .reduce((total, bobina) => total + bobina.peso, 0);
  }
}