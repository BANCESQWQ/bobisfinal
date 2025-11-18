import { Component, Input, Output, EventEmitter, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService, Registro } from '../../services/registro.service';

interface OpcionCombo {
  id: number;
  descripcion: string;
  nombre?: string;
}

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-edit-modal.html',
  styleUrl: './user-edit-modal.scss'
})
export class UserEditModal implements OnChanges, OnInit {
  @Input() registro: Registro | null = null;
  @Input() visible = false;
  @Output() save = new EventEmitter<Registro>();
  @Output() close = new EventEmitter<void>();

  editedRegistro: Registro | null = null;
  isLoading = false;
  errorMessage = '';

  // Opciones para combos
  bobinas: OpcionCombo[] = [];
  proveedores: OpcionCombo[] = [];
  barcos: OpcionCombo[] = [];
  ubicaciones: OpcionCombo[] = [];
  estados: OpcionCombo[] = [];
  molinos: OpcionCombo[] = [];

  constructor(private registroService: RegistroService) {}

  ngOnInit() {
    this.cargarOpcionesCombos();
  }

  ngOnChanges() {
    if (this.registro) {
      // Crear una copia profunda del registro para editar
      this.editedRegistro = JSON.parse(JSON.stringify(this.registro));
      this.errorMessage = '';
    }
  }

  cargarOpcionesCombos() {
    this.registroService.getOpcionesParaCombos().subscribe({
      next: (response) => {
        if (response.success) {
          this.bobinas = response.data.bobinas;
          this.proveedores = response.data.proveedores;
          this.barcos = response.data.barcos;
          this.ubicaciones = response.data.ubicaciones;
          this.estados = response.data.estados;
          this.molinos = response.data.molinos;
        }
      },
      error: (error) => {
        console.error('Error cargando opciones de combos:', error);
      }
    });
  }

  onSave() {
    if (!this.editedRegistro) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.registroService.actualizarRegistro(
      this.editedRegistro.id_registro,
      this.prepararDatosParaEnvio()
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          console.log('✅ Registro actualizado exitosamente');
          this.save.emit(this.editedRegistro!);
        } else {
          this.errorMessage = response.error || 'Error al guardar los cambios';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Error de conexión al guardar';
        console.error('Error al actualizar registro:', error);
      }
    });
  }

  prepararDatosParaEnvio(): any {
    if (!this.editedRegistro) return {};

    return {
      pedido_compra: this.editedRegistro.pedido_compra,
      colada: this.editedRegistro.colada,
      peso: this.editedRegistro.peso,
      cantidad: this.editedRegistro.cantidad,
      lote: this.editedRegistro.lote,
      fecha_inventario: this.editedRegistro.fecha_inventario,
      observaciones: this.editedRegistro.observaciones,
      ton_pedido_compra: this.editedRegistro.ton_pedido_compra,
      fecha_ingreso_planta: this.editedRegistro.fecha_ingreso_planta,
      bobina_id_bobi: this.editedRegistro.bobina_id_bobi,
      proveedor_id_prov: this.editedRegistro.proveedor_id_prov,
      barco_id_barco: this.editedRegistro.barco_id_barco,
      ubicacion_id_ubi: this.editedRegistro.ubicacion_id_ubi,
      estado_id_estado: this.editedRegistro.estado_id_estado,
      molino_id_molino: this.editedRegistro.molino_id_molino,
      n_bobi_proveedor: this.editedRegistro.n_bobi_proveedor,
      bobi_correlativo: this.editedRegistro.bobi_correlativo,
      cod_bobin2: this.editedRegistro.cod_bobin2
    };
  }

  onClose() {
    this.close.emit();
  }

  // Helper para obtener descripción de opciones
  getDescripcionOpcion(lista: OpcionCombo[], id: number): string {
    const opcion = lista.find(item => item.id === id);
    return opcion ? (opcion.descripcion || opcion.nombre || '') : '';
  }
}