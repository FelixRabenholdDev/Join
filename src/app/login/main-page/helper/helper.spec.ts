import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Helper } from './helper';

describe('Helper', () => {
  let component: Helper;
  let fixture: ComponentFixture<Helper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Helper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Helper);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
