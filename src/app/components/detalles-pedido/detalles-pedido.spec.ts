import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesPedido } from './detalles-pedido';

describe('DetallesPedido', () => {
  let component: DetallesPedido;
  let fixture: ComponentFixture<DetallesPedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesPedido]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesPedido);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
