import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTask } from './add-task';

describe('AddTask', () => {
  let component: AddTask;
  let fixture: ComponentFixture<AddTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTask);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
