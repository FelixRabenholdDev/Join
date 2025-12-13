import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListContact } from './list-contact';

describe('ListContact', () => {
  let component: ListContact;
  let fixture: ComponentFixture<ListContact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListContact]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListContact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
