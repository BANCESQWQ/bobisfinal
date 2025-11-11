import { TestBed } from '@angular/core/testing';

import { Registro } from './registro.service';
import { register } from 'module';

describe('User', () => {
  let service: Registro;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(register);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
