import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDespachos } from './historial-despachos';

describe('HistorialDespachos', () => {
  let component: HistorialDespachos;
  let fixture: ComponentFixture<HistorialDespachos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialDespachos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialDespachos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
