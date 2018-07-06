import { TestBed, inject } from '@angular/core/testing';

import { SendDataService } from './send-data.service';

describe('SendDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SendDataService]
    });
  });

  it('should be created', inject([SendDataService], (service: SendDataService) => {
    expect(service).toBeTruthy();
  }));
});
