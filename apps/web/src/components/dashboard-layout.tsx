import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DataRefreshProvider } from '@/lib/data-refresh';
import { TransactionForm } from '@/components/transaction-form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/investments', label: 'Investments', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItems({ className, itemClass }: { className?: string; itemClass: string }) {
  return (
    <nav className={className}>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              itemClass,
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function DashboardLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const showQuickAdd = location.pathname !== '/settings';

  return (
    <DataRefreshProvider>
      <div className="min-h-screen bg-background">
        <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border bg-surface md:flex md:flex-col">
          <div className="px-5 py-5">
            <p className="text-base font-medium">Kharcha</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <NavItems
            className="flex flex-1 flex-col gap-1 px-3"
            itemClass="flex min-h-[44px] items-center gap-3 rounded-md px-3 text-sm"
          />
          <div className="p-3">
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </aside>

        <div className="md:pl-56">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
            <p className="text-base font-medium">Kharcha</p>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </header>

          <main className="px-4 pb-28 pt-4 md:px-6 md:pb-8 md:pt-6">
            {showQuickAdd ? (
              <div className="mb-4">
                <TransactionForm variant="bar" />
              </div>
            ) : null}
            <Outlet />
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden">
          <NavItems
            className="grid grid-cols-4"
            itemClass="flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px]"
          />
        </nav>
      </div>
    </DataRefreshProvider>
  );
}
