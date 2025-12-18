import { TaskType } from '../types/task-type';

export interface Task {
    id?: string;
    type: TaskType;
    date: string;
    title: string;
    description: string;
    priority: number;
}