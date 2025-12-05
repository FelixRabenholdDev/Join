import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleContact } from './single-contact';

describe('SingleContact', () => {
  let component: SingleContact;
  let fixture: ComponentFixture<SingleContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleContact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
