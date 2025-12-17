import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskPreview } from './task-preview';

describe('TaskPreview', () => {
  let component: TaskPreview;
  let fixture: ComponentFixture<TaskPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskPreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
