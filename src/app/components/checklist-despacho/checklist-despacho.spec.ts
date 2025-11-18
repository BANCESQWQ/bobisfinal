import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChecklistDespacho } from './checklist-despacho';

describe('ChecklistDespacho', () => {
  let component: ChecklistDespacho;
  let fixture: ComponentFixture<ChecklistDespacho>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChecklistDespacho]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChecklistDespacho);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
