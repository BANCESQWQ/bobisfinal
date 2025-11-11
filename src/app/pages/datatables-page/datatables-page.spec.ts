import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatatablesPage } from './datatables-page';

describe('DatatablesPage', () => {
  let component: DatatablesPage;
  let fixture: ComponentFixture<DatatablesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatatablesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatatablesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
