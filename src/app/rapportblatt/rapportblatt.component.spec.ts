import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportblattComponent } from './rapportblatt.component';

describe('RapportblattComponent', () => {
  let component: RapportblattComponent;
  let fixture: ComponentFixture<RapportblattComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RapportblattComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RapportblattComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
