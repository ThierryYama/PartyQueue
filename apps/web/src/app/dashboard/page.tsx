import type { Metadata } from 'next';
import { AuthenticatedDashboard } from '../../features/auth/authenticated-dashboard';

export const metadata: Metadata = { title: 'Seu lobby' };

export default function DashboardPage() {
  return <AuthenticatedDashboard />;
}
