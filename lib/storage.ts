"use client";
import { Employee, TaskItem, ScheduleBlock } from './types';

const EMP_KEY = 'agentic.employees.v1';
const TASK_KEY = 'agentic.tasks.v1';
const SCHEDULE_KEY = 'agentic.schedule.v1';

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getEmployees(): Employee[] { return read<Employee[]>(EMP_KEY, []); },
  setEmployees(v: Employee[]) { write(EMP_KEY, v); },
  getTasks(): TaskItem[] { return read<TaskItem[]>(TASK_KEY, []); },
  setTasks(v: TaskItem[]) { write(TASK_KEY, v); },
  getSchedule(): ScheduleBlock[] { return read<ScheduleBlock[]>(SCHEDULE_KEY, []); },
  setSchedule(v: ScheduleBlock[]) { write(SCHEDULE_KEY, v); },
  clear() { write(EMP_KEY, [] as Employee[]); write(TASK_KEY, [] as TaskItem[]); write(SCHEDULE_KEY, [] as ScheduleBlock[]); }
};
