import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MorbidityComponent } from './morbidity.component';

describe('MorbidityComponent', () => {
  let component: MorbidityComponent;
  let fixture: ComponentFixture<MorbidityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MorbidityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MorbidityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
