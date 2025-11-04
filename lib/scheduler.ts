import { addDays, compareAsc, isAfter, isBefore, parseISO } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { Employee, TaskItem, ScheduleBlock } from './types';
import { minutesToTime, timeToMinutes } from './utils';

export type GenerateOptions = {
  startDateISO: string; // yyyy-MM-dd
  horizonDays?: number; // how far to schedule
};

export function generateSchedule(
  employees: Employee[],
  tasks: TaskItem[],
  opts: GenerateOptions
): ScheduleBlock[] {
  const horizon = opts.horizonDays ?? 7;
  const startDate = parseISO(opts.startDateISO);

  const blocks: ScheduleBlock[] = [];
  const pointer: Record<string, { dateISO: string; minute: number }> = {};

  for (const e of employees) {
    pointer[e.id] = { dateISO: opts.startDateISO, minute: timeToMinutes(e.workdayStart) };
  }

  const normalizedTasks = [...tasks].sort((a, b) => {
    const prio = priorityScore(b.priority) - priorityScore(a.priority);
    if (prio !== 0) return prio;
    const dueA = parseISO(a.dueDate);
    const dueB = parseISO(b.dueDate);
    const cmp = compareAsc(dueA, dueB);
    if (cmp !== 0) return cmp;
    return b.durationMinutes - a.durationMinutes;
  });

  for (const task of normalizedTasks) {
    const targetEmployee = pickEmployeeForTask(employees, blocks, task);
    if (!targetEmployee) continue;

    let remaining = task.durationMinutes;
    while (remaining > 0) {
      const p = pointer[targetEmployee.id];
      const dayStart = timeToMinutes(targetEmployee.workdayStart);
      const dayEnd = timeToMinutes(targetEmployee.workdayEnd);

      // Advance to working start if before
      if (p.minute < dayStart) p.minute = dayStart;

      // If pointer past end of day, go to next day start
      if (p.minute >= dayEnd) {
        const next = addDays(parseISO(p.dateISO), 1);
        p.dateISO = next.toISOString().slice(0, 10);
        p.minute = dayStart;
        // stop if beyond horizon
        if (isAfter(next, addDays(startDate, horizon))) break;
        continue;
      }

      const capacity = dayEnd - p.minute;
      const slice = Math.min(remaining, capacity);

      blocks.push({
        id: uuid(),
        employeeId: targetEmployee.id,
        title: task.title,
        type: 'task',
        taskId: task.id,
        date: p.dateISO,
        start: minutesToTime(p.minute),
        end: minutesToTime(p.minute + slice)
      });

      p.minute += slice;
      remaining -= slice;

      if (remaining > 0) {
        // move to next day start
        const next = addDays(parseISO(p.dateISO), 1);
        p.dateISO = next.toISOString().slice(0, 10);
        p.minute = dayStart;
        if (isAfter(next, addDays(startDate, horizon))) break;
      }
    }
  }

  return blocks;
}

function pickEmployeeForTask(
  employees: Employee[],
  blocks: ScheduleBlock[],
  task: TaskItem
): Employee | undefined {
  if (task.assigneeId) return employees.find(e => e.id === task.assigneeId);
  // least load heuristic from existing blocks
  const loadByEmp: Record<string, number> = {};
  for (const e of employees) loadByEmp[e.id] = 0;
  for (const b of blocks) loadByEmp[b.employeeId] += timeToMinutes(b.end) - timeToMinutes(b.start);
  return [...employees].sort((a, b) => loadByEmp[a.id] - loadByEmp[b.id])[0];
}

export function insertUrgentMeeting(
  blocks: ScheduleBlock[],
  employee: Employee,
  durationMinutes: number,
  dateISO: string,
  preferNow = true
): ScheduleBlock[] {
  const dayStart = timeToMinutes(employee.workdayStart);
  const dayEnd = timeToMinutes(employee.workdayEnd);

  const dayBlocks = blocks
    .filter(b => b.employeeId === employee.id && b.date === dateISO)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  let startMinute = preferNow ? Math.max(dayStart, nearestHalfHourNow(dateISO)) : dayStart;
  if (startMinute + durationMinutes > dayEnd) {
    // push to next day morning
    return insertUrgentMeeting(blocks, employee, durationMinutes, addDays(parseISO(dateISO), 1).toISOString().slice(0, 10), false);
  }

  // shift following blocks to make room
  const updated: ScheduleBlock[] = blocks.filter(b => !(b.employeeId === employee.id && b.date === dateISO));
  let carryOver = 0;
  for (const b of dayBlocks) {
    if (timeToMinutes(b.start) >= startMinute) {
      const len = timeToMinutes(b.end) - timeToMinutes(b.start);
      const newStart = timeToMinutes(b.start) + durationMinutes + carryOver;
      const newEnd = newStart + len;
      if (newEnd <= dayEnd) {
        updated.push({ ...b, start: minutesToTime(newStart), end: minutesToTime(newEnd) });
      } else {
        // overflow to next day morning, keep cascading
        carryOver += newEnd - dayEnd;
        updated.push({ ...b, start: minutesToTime(dayEnd - len), end: minutesToTime(dayEnd) });
      }
    } else {
      updated.push(b);
    }
  }

  // handle carryover by moving last blocks to next day preserving order
  if (carryOver > 0 && dayBlocks.length > 0) {
    const nextDate = addDays(parseISO(dateISO), 1).toISOString().slice(0, 10);
    let pointer = dayStart + carryOver;
    for (const b of dayBlocks.reverse()) {
      const len = timeToMinutes(b.end) - timeToMinutes(b.start);
      if (timeToMinutes(b.start) >= startMinute) {
        // move to next day slot
        if (pointer + len > dayEnd) {
          pointer = dayStart; // start new day
        }
        updated.push({ ...b, date: nextDate, start: minutesToTime(pointer), end: minutesToTime(pointer + len) });
        pointer += len;
      }
    }
  }

  // add urgent block
  updated.push({
    id: uuid(),
    employeeId: employee.id,
    title: 'Urgent Meeting',
    type: 'urgent',
    date: dateISO,
    start: minutesToTime(startMinute),
    end: minutesToTime(startMinute + durationMinutes)
  });

  return updated;
}

function nearestHalfHourNow(dateISO: string): number {
  const now = new Date();
  const [y, m, d] = dateISO.split('-').map(Number);
  const today = new Date(y, (m - 1), d);
  const sameDay = now.getFullYear() === today.getFullYear() && now.getMonth() === today.getMonth() && now.getDate() === today.getDate();
  const base = sameDay ? now : new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
  const mins = base.getHours() * 60 + base.getMinutes();
  return Math.ceil(mins / 30) * 30; // round up to next 30min
}

function priorityScore(p: TaskItem['priority']): number {
  switch (p) {
    case 'high': return 2;
    case 'normal': return 1;
    case 'low': return 0;
  }
}
