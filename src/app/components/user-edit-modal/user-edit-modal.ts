import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Registro } from '../../services/registro.service';

@Component({
  selector: 'app-user-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-edit-modal.html',
  styleUrl: './user-edit-modal.scss'
})
export class UserEditModal implements OnChanges {
  @Input() registro: Registro | null = null;
  @Input() visible = false;
  @Output() save = new EventEmitter<Registro>();
  @Output() close = new EventEmitter<void>();

  editedRegistro: Registro | null = null;

  ngOnChanges() {
    if (this.registro) {
      // Crear una copia profunda del registro
      this.editedRegistro = JSON.parse(JSON.stringify(this.registro));
    }
  }

  onSave() {
    if (this.editedRegistro) {
      this.save.emit(this.editedRegistro);
    }
  }

  onClose() {
    this.close.emit();
  }
}