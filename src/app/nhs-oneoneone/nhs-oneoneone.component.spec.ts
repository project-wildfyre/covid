import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NhsOneoneoneComponent } from './nhs-oneoneone.component';

describe('NhsOneoneoneComponent', () => {
  let component: NhsOneoneoneComponent;
  let fixture: ComponentFixture<NhsOneoneoneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NhsOneoneoneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NhsOneoneoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
