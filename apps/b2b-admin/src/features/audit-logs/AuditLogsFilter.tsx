import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const AuditLogsFilterSchema = z.object({
  user: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type AuditLogsFilterValues = z.infer<typeof AuditLogsFilterSchema>;

export interface AuditLogsFilterProps {
  onFilter: (values: AuditLogsFilterValues) => void;
}

export function AuditLogsFilter({ onFilter }: AuditLogsFilterProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuditLogsFilterValues>({
    resolver: zodResolver(AuditLogsFilterSchema),
    defaultValues: {},
  });

  return (
    <form className="mb-4 flex flex-wrap gap-4 items-end" onSubmit={handleSubmit(onFilter)} aria-label="Audit Logs Filter">
      <div>
        <label htmlFor="user" className="block text-sm font-medium">User</label>
        <input id="user" {...register('user')} className="border rounded px-2 py-1" />
        {errors.user && <span className="text-red-500 text-xs">{errors.user.message}</span>}
      </div>
      <div>
        <label htmlFor="action" className="block text-sm font-medium">Action</label>
        <input id="action" {...register('action')} className="border rounded px-2 py-1" />
        {errors.action && <span className="text-red-500 text-xs">{errors.action.message}</span>}
      </div>
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium">Start Date</label>
        <input id="startDate" type="date" {...register('startDate')} className="border rounded px-2 py-1" />
        {errors.startDate && <span className="text-red-500 text-xs">{errors.startDate.message}</span>}
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium">End Date</label>
        <input id="endDate" type="date" {...register('endDate')} className="border rounded px-2 py-1" />
        {errors.endDate && <span className="text-red-500 text-xs">{errors.endDate.message}</span>}
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Filter</button>
    </form>
  );
}
