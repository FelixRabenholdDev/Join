import { Pipe, type PipeTransform } from '@angular/core';
import { BoardTask } from '../../interfaces/task-board.interface';

/**
 * Task Filtering Pipe
 * 
 * Angular pipe for filtering task lists based on case-insensitive search text.
 * Searches through both task title and description fields.
 * 
 * Features:
 * - Case-insensitive search
 * - Searches title and description fields
 * - Handles null/undefined inputs gracefully
 * - Returns original array if search text is empty
 * 
 * @pipe
 * @name FilterTask
 * @standalone true
 * 
 * @example
 * // Template usage
 * <div *ngFor="let task of tasks | FilterTask : searchInput">
 *   {{ task.title }}
 * </div>
 * 
 * // Works with two-way binding on search input
 * <input [(ngModel)]="searchInput" />
 * <div *ngFor="let task of allTasks | FilterTask : searchInput"></div>
 */
@Pipe({
  name: 'FilterTask',
  standalone: true,
})
export class FilterTaskPipe implements PipeTransform {

  /**
   * Transforms a task list by filtering based on search text
   * 
   * Performs case-insensitive search across task title and description.
   * Returns empty array if tasks array is null/undefined.
   * Returns original array if search text is empty.
   * 
   * @param {BoardTask[] | null} tasks - Array of tasks to filter, or null
   * @param {string} searchText - Text to search for in task title/description
   * @returns {BoardTask[]} Filtered array of matching tasks
   * 
   * @example
   * transform([task1, task2], 'search'); // returns matching tasks
   * transform(null, 'search'); // returns []
   * transform([task1, task2], ''); // returns [task1, task2]
   */
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
