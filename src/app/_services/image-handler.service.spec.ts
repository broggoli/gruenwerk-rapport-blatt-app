import { TestBed, inject } from '@angular/core/testing';

import { ImageHandlerService } from './image-handler.service';

describe('ImageHandlerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImageHandlerService]
    });
  });

  it('should be created', inject([ImageHandlerService], (service: ImageHandlerService) => {
    expect(service).toBeTruthy();
  }));
});
