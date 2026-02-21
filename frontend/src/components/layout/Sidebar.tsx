import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Map,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { canViewAnalytics } from '@/lib/permissions';

const nav = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard },
  { to: '/map', label: 'Live Map', icon: Map },
  { to: '/vehicles', label: 'Vehicle Registry', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trip Dispatch', icon: MapPin },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/fuel', label: 'Fuel & Expense', icon: Fuel },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const showAnalytics = user && canViewAnalytics(user.role);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-background/80 backdrop-blur-2xl">
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/25">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">FleetFlow</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-4">
          {nav.filter((item) => item.to !== '/analytics' || showAnalytics).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
              <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
            <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {user?.role.replace('_', ' ')}
              {user?.role === 'SAFETY_OFFICER' && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">Read-only</span>
              )}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
