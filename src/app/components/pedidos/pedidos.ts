import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService, Registro } from '../../services/registro.service';
import { UserViewModal } from '../user-view-modal/user-view-modal';
import { DetallesPedido } from '../detalles-pedido/detalles-pedido';
import { PedidoService, PedidoCab, PedidoPendiente } from '../../services/pedido.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, UserViewModal, DetallesPedido],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.scss'
})
export class Pedidos implements OnInit {
  // Datos principales
  registros: Registro[] = [];
  filteredRegistros: Registro[] = [];
  registrosSeleccionados: Registro[] = [];
  pedidosRecientes: PedidoCab[] = [];
  
  // Información del usuario actual (simplificado)
  usuarioActual: any = null;
  puedeCrearPedidos: boolean = true;
  puedeConsultar: boolean = true;
  puedeDespachar: boolean = true;
  
  // Estados
  isLoading = true;
  isLoadingPedidos = false;
  searchTerm = '';
  observacionesDespacho = '';
  
  // Modales
  selectedRegistro: Registro | null = null;
  showViewModal = false;
  showDetallesPedidoModal = false;

  // Variables para drag and drop
  dragItem: Registro | null = null;

  
  constructor(
    private registroService: RegistroService,
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarUsuarioActual();
    this.loadRegistros();
    this.loadPedidosRecientes();
  }

  async cargarUsuarioActual() {
    // Usuario por defecto sin sistema de roles complejo
    this.usuarioActual = {
      id_usuario: 1,
      nombre_usuario: 'Operador',
      apellido_usuario: 'Sistema'
    };
    this.puedeCrearPedidos = true;
    this.puedeConsultar = true;
    this.puedeDespachar = true;
  }

  loadRegistros() {
    this.isLoading = true;
    // Usar el método que solo trae registros disponibles (estado = 1)
    this.registroService.getRegistrosDisponibles(1, 100, '')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.registros = response.data;
            this.filteredRegistros = this.ordenarRegistros(response.data);
            console.log('Registros disponibles cargados:', this.registros.length);
          } else {
            console.error('Error en respuesta del servicio:', response);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando registros disponibles:', error);
          this.isLoading = false;
        }
      });
  }

  loadPedidosRecientes() {
    this.isLoadingPedidos = true;
    this.pedidoService.getPedidosEnCurso()
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.pedidosRecientes = response.data;
            console.log('Pedidos recientes cargados:', this.pedidosRecientes.length);
          } else {
            console.error('Error en respuesta de pedidos:', response);
          }
          this.isLoadingPedidos = false;
        },
        error: (error) => {
          console.error('Error cargando pedidos recientes:', error);
          this.isLoadingPedidos = false;
        }
      });
  }

  ordenarRegistros(registros: Registro[]): Registro[] {
    return registros.sort((a, b) => {
      const dateA = new Date(a.fecha_ingreso_planta || '');
      const dateB = new Date(b.fecha_ingreso_planta || '');
      return dateA.getTime() - dateB.getTime(); // Orden ascendente
    });
  }

  aplicarFiltros() {
    if (!this.searchTerm.trim()) {
      this.filteredRegistros = this.ordenarRegistros(this.registros);
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredRegistros = this.ordenarRegistros(
      this.registros.filter(registro =>
        // Búsqueda en descripción de bobina
        registro.bobina_desc?.toLowerCase().includes(searchLower) ||
        // Búsqueda en código nivel 2
        registro.cod_bobin2?.toString().toLowerCase().includes(searchLower) ||
        // Búsqueda en lote
        registro.lote?.toString().toLowerCase().includes(searchLower) ||
        // Búsqueda en pedido de compra
        registro.pedido_compra?.toLowerCase().includes(searchLower) ||
        // Búsqueda en colada
        registro.colada?.toLowerCase().includes(searchLower) ||
        // Búsqueda en proveedor
        registro.proveedor_nombre?.toLowerCase().includes(searchLower) ||
        // Búsqueda en observaciones
        registro.observaciones?.toLowerCase().includes(searchLower)
      )
    );
  }

  // Drag and Drop Functions
  onDragStart(registro: Registro, event: DragEvent) {
    if (!this.puedeCrearPedidos) {
      event.preventDefault();
      return;
    }
    
    this.dragItem = registro;
    event.dataTransfer?.setData('text/plain', registro.id_registro.toString());
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent) {
    if (this.puedeCrearPedidos) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (this.dragItem && !this.estaSeleccionado(this.dragItem) && this.puedeCrearPedidos) {
      this.seleccionarRegistro(this.dragItem);
    }
    this.dragItem = null;
  }

  // Gestión de selección
  seleccionarRegistro(registro: Registro) {
    if (!this.puedeCrearPedidos) {
      alert('No tienes permisos para agregar registros a pedidos.');
      return;
    }

    if (!this.estaSeleccionado(registro)) {
      this.registrosSeleccionados.push(registro);
    }
  }

  quitarRegistro(registro: Registro) {
    if (!this.puedeCrearPedidos) {
      alert('No tienes permisos para modificar pedidos.');
      return;
    }

    this.registrosSeleccionados = this.registrosSeleccionados.filter(
      r => r.id_registro !== registro.id_registro
    );
  }

  estaSeleccionado(registro: Registro): boolean {
    return this.registrosSeleccionados.some(
      r => r.id_registro === registro.id_registro
    );
  }

  // Modales
  verDetalles(registro: Registro, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedRegistro = registro;
    this.showViewModal = true;
  }

  verDetallesPedido() {
    this.showDetallesPedidoModal = true;
  }

  closeModals() {
    this.showViewModal = false;
    this.showDetallesPedidoModal = false;
    this.selectedRegistro = null;
  }

 

  // Envío de despacho
 
enviarDespacho() {
  if (this.registrosSeleccionados.length === 0) {
    alert('Por favor selecciona al menos un registro para despachar');
    return;
  }

  if (!this.puedeCrearPedidos) {
    alert('No tienes permisos para crear pedidos.');
    return;
  }

  const pedidoData = {
    usuario_solicita_id: this.usuarioActual.id_usuario,
    observaciones: this.observacionesDespacho,
    registros: this.registrosSeleccionados.map(r => r.id_registro)
  };

  console.log('Enviando pedido:', pedidoData);

  this.pedidoService.crearPedido(pedidoData).subscribe({
    next: (response) => {
      if (response.success) {
        // Crear objeto de pedido para mostrar en el historial
        const nuevoPedido: PedidoCab = {
          id_pedido: response.id_pedido,
          fecha_pedido: new Date().toISOString(),
          usuario_solicita_id: this.usuarioActual.id_usuario,
          estado_pedido: 'Enviado',
          observaciones: this.observacionesDespacho,
          solicitante: `${this.usuarioActual.nombre_usuario} ${this.usuarioActual.apellido_usuario}`,
          cant_bobinas: this.registrosSeleccionados.length
        };

        // Agregar al inicio de la lista
        this.pedidosRecientes.unshift(nuevoPedido);
        
        // Crear pedido pendiente para el checklist
        const pedidoPendiente: PedidoPendiente = {
          id_pedido: response.id_pedido, // El ID que retorna el backend
          fecha_pedido: new Date().toISOString(),
          estado_pedido: 'Enviado',
          observaciones: this.observacionesDespacho,
          solicitante: `${this.usuarioActual.nombre_usuario} ${this.usuarioActual.apellido_usuario}`,
          bobinas_count: this.registrosSeleccionados.length,
          bobinas: this.registrosSeleccionados.map(reg => ({
            id_registro: reg.id_registro,
            id_pedido_det: 0, // Se asignará cuando se cree en BD
            bobina_desc: reg.bobina_desc || 'Bobina sin descripción',
            pedido_compra: reg.pedido_compra,
            colada: reg.colada,
            peso: reg.peso,
            seleccionada: false
          }))
        };

        // Agregar al servicio para que esté disponible en el checklist
        this.pedidoService.agregarPedidoPendiente(pedidoPendiente);

        // Mostrar mensaje de éxito
        alert(`✅ Pedido #${response.id_pedido} enviado exitosamente con ${this.registrosSeleccionados.length} bobinas`);
        
        // Recargar registros disponibles (las bobinas despachadas ya no aparecerán)
        this.loadRegistros();
        
        // Limpiar y cambiar a historial de despachos
        this.registrosSeleccionados = [];
        this.observacionesDespacho = '';
        this.router.navigate(['/historial-despachos']);
        
      } else {
        alert('❌ Error al enviar el pedido: ' + (response.error || 'Error desconocido'));
      }
    },
    error: (error) => {
      console.error('Error enviando pedido:', error);
      alert('❌ Error al enviar el pedido. Verifica la conexión con el servidor.');
    }
  });
}

  // Métodos helper para estilos
  getStatusClass(estadoId: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'bg-gray-100 text-gray-800 border-gray-200',     // En planta
      1: 'bg-green-100 text-green-800 border-green-200',  // Disponible
      2: 'bg-blue-100 text-blue-800 border-blue-200',     // Despachada
      3: 'bg-red-100 text-red-800 border-red-200'         // Otros estados
    };
    return statusMap[estadoId] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getEstadoText(estadoId: number): string {
    const estadoMap: { [key: number]: string } = {
      0: 'En planta',
      1: 'Disponible', 
      2: 'Despachada',
      3: 'No disponible'
    };
    return estadoMap[estadoId] || 'Desconocido';
  }

  getStatusClassPedido(estado: string): string {
    const statusMap: { [key: string]: string } = {
      'Borrador': 'bg-gray-100 text-gray-800 border-gray-200',
      'Enviado': 'bg-blue-100 text-blue-800 border-blue-200',
      'Atendido': 'bg-green-100 text-green-800 border-green-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200',
      'Procesando': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return statusMap[estado] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  // Formatear fecha para mostrar
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

  // Ver detalles de un pedido específico
  verDetallesPedidoEspecifico(pedido: PedidoCab) {
    if (!this.puedeConsultar) {
      alert('No tienes permisos para consultar detalles de pedidos.');
      return;
    }

    this.pedidoService.getDetallePedido(pedido.id_pedido)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.registrosSeleccionados = response.data;
            this.showDetallesPedidoModal = true;
          } else {
            alert('Error al cargar los detalles del pedido: ' + response.error);
          }
        },
        error: (error) => {
          console.error('Error cargando detalles del pedido:', error);
          alert('Error al cargar los detalles del pedido');
        }
      });
  }

  // Obtener texto del botón según permisos
  getTextoBotonDespacho(): string {
    if (!this.puedeCrearPedidos) {
      return 'Sin Permisos';
    }
    return `Enviar Despacho (${this.registrosSeleccionados.length})`;
  }

  // Verificar si el botón debe estar deshabilitado
  estaBotonDeshabilitado(): boolean {
    return this.registrosSeleccionados.length === 0 || !this.puedeCrearPedidos;
  }

  // Recargar registros disponibles
  recargarRegistros() {
    this.loadRegistros();
    this.searchTerm = '';
  }
}