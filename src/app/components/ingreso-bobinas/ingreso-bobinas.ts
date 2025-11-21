import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ingreso-bobinas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ingreso-bobinas.html',
})
export class IngresoBobinas implements OnInit {
  ingresoForm: FormGroup;
  isLoading = false;
  mensajeExito = '';
  mensajeError = '';
  
  // Opciones para combos
  bobinas: any[] = [];
  proveedores: any[] = [];
  barcos: any[] = [];
  ubicaciones: any[] = [];
  estados: any[] = [];
  molinos: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.ingresoForm = this.fb.group({
      fecha_llegada: ['', Validators.required],
      pedido_compra: ['', Validators.required],
      colada: ['', Validators.required],
      peso: ['', [Validators.required, Validators.min(0.1)]],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      lote: [''],
      fecha_inventario: [''],
      observaciones: [''],
      ton_pedido_compra: [''],
      fecha_ingreso_planta: [this.getCurrentDate()],
      bobina_id_bobi: ['', Validators.required],
      proveedor_id_prov: ['', Validators.required],
      barco_id_barco: [''],
      ubicacion_id_ubi: [''],
      estado_id_estado: ['1', Validators.required], // Valor por defecto
      molino_id_molino: [''],
      n_bobi_proveedor: [''],
      bobi_correlativo: [''],
      cod_bobina2: [''] // Nombre corregido
    });
  }

  ngOnInit() {
    this.cargarOpcionesCombos();
  }

  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  cargarOpcionesCombos() {
    this.http.get<any>('http://localhost:5000/api/opciones-combos').subscribe({
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
        console.error('Error cargando opciones:', error);
      }
    });
  }

  onSubmit() {
    if (this.ingresoForm.valid) {
      this.isLoading = true;
      this.mensajeExito = '';
      this.mensajeError = '';
      
      const formData = this.ingresoForm.value;

      // Asegurar que los campos numéricos sean números
      if (formData.peso) formData.peso = parseFloat(formData.peso);
      if (formData.cantidad) formData.cantidad = parseInt(formData.cantidad);
      if (formData.ton_pedido_compra) formData.ton_pedido_compra = parseFloat(formData.ton_pedido_compra);

      // Asegurar que los IDs sean números
      if (formData.bobina_id_bobi) formData.bobina_id_bobi = parseInt(formData.bobina_id_bobi);
      if (formData.proveedor_id_prov) formData.proveedor_id_prov = parseInt(formData.proveedor_id_prov);
      if (formData.barco_id_barco) formData.barco_id_barco = parseInt(formData.barco_id_barco);
      if (formData.ubicacion_id_ubi) formData.ubicacion_id_ubi = parseInt(formData.ubicacion_id_ubi);
      if (formData.estado_id_estado) formData.estado_id_estado = parseInt(formData.estado_id_estado);
      if (formData.molino_id_molino) formData.molino_id_molino = parseInt(formData.molino_id_molino);

      console.log('Datos a enviar:', formData);

      this.http.post('http://localhost:5000/api/registros', formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.mensajeExito = 'Bobina ingresada correctamente';
            this.ingresoForm.reset({
              estado_id_estado: '1',
              fecha_ingreso_planta: this.getCurrentDate()
            });
          } else {
            this.mensajeError = response.error || 'Error al ingresar la bobina';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.mensajeError = 'Error de conexión al servidor';
          this.isLoading = false;
          console.error('Error:', error);
        }
      });
    } else {
      this.mensajeError = 'Por favor complete todos los campos requeridos';
      this.marcarCamposInvalidos();
    }
  }

  private marcarCamposInvalidos() {
    Object.keys(this.ingresoForm.controls).forEach(key => {
      const control = this.ingresoForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }
}