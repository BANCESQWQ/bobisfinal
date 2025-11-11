import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header'; // ← Agregar Header
import { Datatables } from '../../components/datatables/datatables';

@Component({
  selector: 'app-datatables-page',
  standalone: true,
  imports: [CommonModule, Header, Datatables], // ← Agregar Header también
  templateUrl: './datatables-page.html',
  styleUrl: './datatables-page.scss'
})
export class DatatablesPage { }