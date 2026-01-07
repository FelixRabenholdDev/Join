import { Pipe, type PipeTransform } from '@angular/core';
import { BoardTask } from '../../interfaces/task-board.interface';

@Pipe({
  name: 'FilterTask',
  standalone: true,
})
export class FilterTaskPipe implements PipeTransform {

  transform(tasks: BoardTask[] | null, searchText: string): BoardTask[] {
    if (!tasks) return [];
    if (!searchText) return tasks;

    searchText = searchText.toLowerCase();

    return tasks.filter(task => {
      const title = task.title?.toLowerCase() || '';
      const description = task.description?.toLowerCase() || '';

      return title.includes(searchText) || description.includes(searchText);
    })
  }

}
