"use client";
import { useEffect, useMemo, useState } from 'react';
import { Employee, TaskItem } from '@lib/types';
import { storage } from '@lib/storage';

export default function DailyReport() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));

  useEffect(() => { setEmployees(storage.getEmployees()); setTasks(storage.getTasks()); }, []);
  useEffect(() => { storage.setTasks(tasks); }, [tasks]);

  const done = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const pending = useMemo(() => tasks.filter(t => !t.completed), [tasks]);

  const report = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Daily Report - ${date}`);
    lines.push('');
    lines.push('Completed:');
    for (const t of done) lines.push(`- ${t.title} (${t.durationMinutes}m)`);
    lines.push('');
    lines.push('Pending:');
    for (const t of pending) lines.push(`- ${t.title} due ${t.dueDate} (${t.durationMinutes}m)`);
    return lines.join('\n');
  }, [done, pending, date]);

  function emailAll() {
    const to = employees.map(e => e.email).filter(Boolean).join(',');
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('Daily Report')}&body=${encodeURIComponent(report)}`;
    window.location.href = mailto;
  }

  return (
    <div className="card">
      <div className="section-title" style={{ justifyContent: 'space-between' }}>
        <h2>Daily Report</h2>
        <div className="flex">
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="button" onClick={emailAll}>Email Team</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h3>Completed</h3>
          <ul>
            {done.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>
        </div>
        <div>
          <h3>Pending</h3>
          <ul>
            {pending.map(t => <li key={t.id}>{t.title}</li>)}
          </ul>
        </div>
      </div>

      <textarea className="input" rows={8} value={report} readOnly style={{ marginTop: 12 }} />
    </div>
  );
}
