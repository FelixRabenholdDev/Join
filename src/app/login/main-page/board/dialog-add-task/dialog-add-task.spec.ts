import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogAddTask } from './dialog-add-task';

describe('DialogAddTask', () => {
  let component: DialogAddTask;
  let fixture: ComponentFixture<DialogAddTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogAddTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogAddTask);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
