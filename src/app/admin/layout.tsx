import { AdminProblemsCacheProvider } from '@/components/context/AdminProblemsCacheContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProblemsCacheProvider>{children}</AdminProblemsCacheProvider>;
}

