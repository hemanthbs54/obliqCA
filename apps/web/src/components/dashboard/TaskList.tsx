'use client';

import { formatDate, type Task } from '@obliq/shared';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useUpdateTask } from '@/hooks/useFilings';

const STATUS_TONE: Record<Task['status'], 'default' | 'green' | 'amber' | 'red'> = {
  pending: 'default',
  in_progress: 'amber',
  completed: 'green',
  overdue: 'red',
};

export function TaskList({ clientId, tasks }: { clientId: string; tasks: Task[] }) {
  const updateTask = useUpdateTask(clientId);

  if (tasks.length === 0) {
    return <p className="text-sm text-ink-muted">No tasks yet. Attach a filing to generate one.</p>;
  }

  return (
    <div className="divide-y divide-base-border rounded-2xl border border-base-border">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">{task.period_label}</p>
            <p className="text-xs text-ink-muted">Due {formatDate(task.due_date)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={STATUS_TONE[task.status]}>{task.status.replace('_', ' ')}</Badge>
            <Select
              className="h-8 w-36 text-xs"
              value={task.status}
              onChange={(e) =>
                updateTask.mutate({ taskId: task.id, status: e.target.value })
              }
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}
