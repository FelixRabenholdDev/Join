import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirebaseServices } from './firebase-services';

describe('FirebaseServices', () => {
  let component: FirebaseServices;
  let fixture: ComponentFixture<FirebaseServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirebaseServices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirebaseServices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
