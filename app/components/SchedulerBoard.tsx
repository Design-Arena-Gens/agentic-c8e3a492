"use client";
import { useEffect, useMemo, useState } from 'react';
import { Employee, ScheduleBlock, TaskItem } from '@lib/types';
import { storage } from '@lib/storage';
import { generateSchedule, insertUrgentMeeting } from '@lib/scheduler';
import { timeToMinutes } from '@lib/utils';

export default function SchedulerBoard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));

  useEffect(() => { setEmployees(storage.getEmployees()); setTasks(storage.getTasks()); setSchedule(storage.getSchedule()); }, []);
  useEffect(() => { storage.setSchedule(schedule); }, [schedule]);

  function generate() {
    const blocks = generateSchedule(employees, tasks, { startDateISO: date, horizonDays: 14 });
    setSchedule(blocks);
  }

  function clearSchedule() { setSchedule([]); }

  function handleUrgent(emp: Employee) {
    const minutes = Number(prompt(`Urgent meeting duration (minutes) for ${emp.name}`, '30') || '0');
    if (!minutes || minutes <= 0) return;
    const updated = insertUrgentMeeting(schedule, emp, minutes, date, true);
    setSchedule(updated);
  }

  const grouped = useMemo(() => {
    const map: Record<string, ScheduleBlock[]> = {};
    for (const e of employees) map[e.id] = [];
    for (const b of schedule) {
      if (b.date !== date) continue;
      (map[b.employeeId] ||= []).push(b);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    }
    return map;
  }, [schedule, employees, date]);

  return (
    <div className="card">
      <div className="section-title" style={{ justifyContent: 'space-between' }}>
        <h2>Schedule</h2>
        <div className="flex">
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="button" onClick={generate}>Generate</button>
          <button className="button secondary" onClick={clearSchedule}>Clear</button>
        </div>
      </div>

      <div className="row" style={{ gridTemplateColumns: `repeat(${Math.max(employees.length, 1)}, 1fr)` }}>
        {employees.length === 0 && <p className="help">Add team members to get started.</p>}
        {employees.map(emp => (
          <div key={emp.id} className="schedule-col">
            <div className="flex" style={{ justifyContent: 'space-between' }}>
              <strong>{emp.name}</strong>
              <button className="button" onClick={() => handleUrgent(emp)}>Insert urgent</button>
            </div>
            <p className="help">Hours {emp.workdayStart} - {emp.workdayEnd}</p>
            {grouped[emp.id]?.map(b => (
              <div key={b.id} className={`block ${b.type === 'meeting' ? 'meeting' : ''} ${b.type === 'urgent' ? 'urgent' : ''}`}>
                <div className="flex" style={{ justifyContent: 'space-between' }}>
                  <span>{b.start} - {b.end}</span>
                  <span className="badge">{b.type}</span>
                </div>
                <div>{b.title}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
