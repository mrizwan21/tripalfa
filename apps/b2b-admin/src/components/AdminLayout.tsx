import Shell from './ui/Shell';
import { Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}
