"use client";
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Employee, TaskItem } from '@lib/types';
import { storage } from '@lib/storage';

export default function TaskForm() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [draft, setDraft] = useState<Partial<TaskItem>>({ priority: 'normal', durationMinutes: 60, dueDate: new Date().toISOString().slice(0,10) });

  useEffect(() => { setEmployees(storage.getEmployees()); setTasks(storage.getTasks()); }, []);
  useEffect(() => { storage.setTasks(tasks); }, [tasks]);

  function addTask() {
    if (!draft.title || !draft.durationMinutes || !draft.dueDate) return;
    const t: TaskItem = {
      id: uuid(),
      title: draft.title,
      description: draft.description || undefined,
      durationMinutes: Number(draft.durationMinutes),
      dueDate: draft.dueDate,
      priority: (draft.priority as TaskItem['priority']) || 'normal',
      assigneeId: draft.assigneeId || undefined,
      completed: false
    };
    setTasks(prev => [...prev, t]);
    setDraft({ priority: 'normal', durationMinutes: 60, dueDate: new Date().toISOString().slice(0,10) });
  }

  function toggleComplete(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function removeTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="card">
      <h2 className="section-title">Tasks</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <input className="input" placeholder="Title" value={draft.title || ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
        <input className="input" placeholder="Description" value={draft.description || ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} />
        <input className="input" type="number" min={15} step={15} placeholder="Minutes" value={draft.durationMinutes || 60} onChange={e => setDraft(d => ({ ...d, durationMinutes: Number(e.target.value) }))} />
        <input className="input" type="date" value={draft.dueDate || new Date().toISOString().slice(0,10)} onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))} />
        <select className="input" value={draft.priority || 'normal'} onChange={e => setDraft(d => ({ ...d, priority: e.target.value as any }))}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <select className="input" value={draft.assigneeId || ''} onChange={e => setDraft(d => ({ ...d, assigneeId: e.target.value || undefined }))}>
          <option value="">Unassigned</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <div className="flex" style={{ marginTop: 12 }}>
        <button className="button" onClick={addTask}>Add</button>
        <button className="button secondary" onClick={() => { setTasks([]); storage.setTasks([]); }}>Clear All</button>
      </div>
      <table className="table" style={{ marginTop: 12 }}>
        <thead><tr><th>Title</th><th>Assignee</th><th>Dur</th><th>Due</th><th>Prio</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{employees.find(e => e.id === t.assigneeId)?.name || '-'}</td>
              <td>{t.durationMinutes}m</td>
              <td>{t.dueDate}</td>
              <td><span className="badge">{t.priority}</span></td>
              <td>
                <label className="flex"><input type="checkbox" checked={!!t.completed} onChange={() => toggleComplete(t.id)} /> done</label>
              </td>
              <td><button className="button secondary" onClick={() => removeTask(t.id)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
