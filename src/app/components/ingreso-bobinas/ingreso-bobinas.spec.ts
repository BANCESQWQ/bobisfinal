import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoBobinas } from './ingreso-bobinas';

describe('IngresoBobinas', () => {
  let component: IngresoBobinas;
  let fixture: ComponentFixture<IngresoBobinas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngresoBobinas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngresoBobinas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
