import EmployeeForm from './components/EmployeeForm';
import TaskForm from './components/TaskForm';
import SchedulerBoard from './components/SchedulerBoard';
import ReminderPanel from './components/ReminderPanel';
import DailyReport from './components/DailyReport';

export default function Page() {
  return (
    <div className="grid">
      <EmployeeForm />
      <TaskForm />
      <SchedulerBoard />
      <ReminderPanel />
      <DailyReport />
    </div>
  );
}
