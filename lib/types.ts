export type Employee = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  workdayStart: string; // "09:00"
  workdayEnd: string;   // "17:00"
};

export type TaskItem = {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number; // effort
  dueDate: string; // ISO date
  priority: 'low' | 'normal' | 'high';
  assigneeId?: string; // optional preferred
  completed?: boolean;
};

export type ScheduleBlock = {
  id: string;
  employeeId: string;
  title: string;
  type: 'task' | 'meeting' | 'urgent';
  taskId?: string;
  date: string; // ISO date (yyyy-MM-dd)
  start: string; // HH:mm
  end: string;   // HH:mm
  notes?: string;
};

export type ReminderChannel = 'whatsapp' | 'email' | 'notification';
