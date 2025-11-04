"use client";
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Employee } from '@lib/types';
import { storage } from '@lib/storage';

export default function EmployeeForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [draft, setDraft] = useState<Partial<Employee>>({ workdayStart: '09:00', workdayEnd: '17:00' });

  useEffect(() => {
    setEmployees(storage.getEmployees());
  }, []);

  useEffect(() => {
    storage.setEmployees(employees);
  }, [employees]);

  function addEmployee() {
    if (!draft.name) return;
    const e: Employee = {
      id: uuid(),
      name: draft.name,
      email: draft.email?.trim() || undefined,
      phone: draft.phone?.trim() || undefined,
      workdayStart: draft.workdayStart || '09:00',
      workdayEnd: draft.workdayEnd || '17:00'
    };
    setEmployees(prev => [...prev, e]);
    setDraft({ workdayStart: '09:00', workdayEnd: '17:00' });
  }

  function removeEmployee(id: string) {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="card">
      <h2 className="section-title">Team Members</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <input className="input" placeholder="Name" value={draft.name || ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
        <input className="input" placeholder="Email (optional)" value={draft.email || ''} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
        <input className="input" placeholder="Phone (WhatsApp)" value={draft.phone || ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
        <input className="input" type="time" title="Workday start" value={draft.workdayStart || '09:00'} onChange={e => setDraft(d => ({ ...d, workdayStart: e.target.value }))} />
        <input className="input" type="time" title="Workday end" value={draft.workdayEnd || '17:00'} onChange={e => setDraft(d => ({ ...d, workdayEnd: e.target.value }))} />
        <button className="button" onClick={addEmployee}>Add</button>
      </div>

      <table className="table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Hours</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map(e => (
            <tr key={e.id}>
              <td>{e.name}</td>
              <td>{e.email || '-'}</td>
              <td>{e.phone || '-'}</td>
              <td>{e.workdayStart} - {e.workdayEnd}</td>
              <td><button className="button secondary" onClick={() => removeEmployee(e.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
