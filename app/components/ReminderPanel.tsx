"use client";
import { useEffect, useMemo, useState } from 'react';
import { Employee, ScheduleBlock } from '@lib/types';
import { storage } from '@lib/storage';
import { buildICS } from '@lib/ics';

export default function ReminderPanel() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));

  useEffect(() => { setEmployees(storage.getEmployees()); setSchedule(storage.getSchedule()); }, []);

  async function enableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) return alert('Notifications not supported');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') alert('Notifications disabled');
  }

  function notifyNow(block: ScheduleBlock) {
    if (!('Notification' in window)) return;
    new Notification(`${block.title} (${block.start}-${block.end})`, { body: 'Reminder from Agentic Scheduler' });
  }

  function ics(block: ScheduleBlock) {
    const content = buildICS({ title: block.title, dateISO: block.date, startHHMM: block.start, endHHMM: block.end });
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${block.title}-${block.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function waLink(phone?: string, text?: string) {
    if (!phone) return '#';
    const num = phone.replace(/\D/g, '');
    return `https://wa.me/${num}?text=${encodeURIComponent(text || '')}`;
  }

  function emailLink(email?: string, subject?: string, body?: string) {
    if (!email) return '#';
    return `mailto:${email}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
  }

  const todaysBlocks = useMemo(() => schedule.filter(b => b.date === date), [schedule, date]);

  return (
    <div className="card">
      <div className="section-title" style={{ justifyContent: 'space-between' }}>
        <h2>Reminders</h2>
        <div className="flex">
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="button" onClick={enableNotifications}>Enable Notifications</button>
        </div>
      </div>

      <table className="table">
        <thead><tr><th>Assignee</th><th>Time</th><th>Title</th><th>WhatsApp</th><th>Email</th><th>ICS</th><th>Notify</th></tr></thead>
        <tbody>
          {todaysBlocks.map(b => {
            const emp = employees.find(e => e.id === b.employeeId);
            const text = `Reminder: ${b.title} ${b.date} ${b.start}-${b.end}`;
            return (
              <tr key={b.id}>
                <td>{emp?.name || '-'}</td>
                <td>{b.start} - {b.end}</td>
                <td>{b.title}</td>
                <td><a className="button" href={waLink(emp?.phone, text)} target="_blank">WhatsApp</a></td>
                <td><a className="button" href={emailLink(emp?.email, 'Task Reminder', text)}>Email</a></td>
                <td><button className="button secondary" onClick={() => ics(b)}>ICS</button></td>
                <td><button className="button secondary" onClick={() => notifyNow(b)}>Notify</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
