import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserViewModal } from './user-view-modal';

describe('UserViewModal', () => {
  let component: UserViewModal;
  let fixture: ComponentFixture<UserViewModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserViewModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserViewModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
