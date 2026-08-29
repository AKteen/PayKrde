import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, Car, LayoutDashboard, LogOut, Receipt, Settings, TrendingUp, UtensilsCrossed, Wallet } from 'lucide-react';
import type { Profile } from '@kharcha/shared';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { cn, firstName, initials } from '@/lib/utils';
import { PageEnter } from '@/components/page-enter';
import { ReminderBell } from '@/components/reminder-bell';

const NAV = [
  { to: '/dashboard', label: 'Home', short: 'Home', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', short: 'Txns', icon: Receipt },
  { to: '/money', label: 'Money', short: 'Money', icon: Wallet },
  { to: '/diet', label: 'Diet', short: 'Diet', icon: UtensilsCrossed },
  { to: '/udhar', label: 'Udhar', short: 'Udhar', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Analytics', short: 'Stats', icon: BarChart3 },
  { to: '/vehicles', label: 'Vehicles', short: 'Vehicle', icon: Car },
  { to: '/investments', label: 'Investments', short: 'Invest', icon: TrendingUp },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: Settings },
];

function NavItems({
  className,
  itemClass,
  compact,
}: {
  className?: string;
  itemClass: string;
  compact?: boolean;
}) {
  return (
    <nav className={className}>
      {NAV.map(({ to, label, short, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }: { isActive: boolean }) =>
            cn(
              itemClass,
              isActive
                ? 'bg-cream text-gold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              'transition-colors duration-200',
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{compact ? short : label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function DashboardLayout() {
  const { signOut, user } = useAuth();
  const { nonce } = useDataRefresh();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    api<Profile>('/api/profile')
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [nonce]);

  const name = profile?.full_name || firstName(null, user?.email ?? null);
  const letters = initials(profile?.full_name, user?.email);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-surface md:flex md:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <img src="/kharcha-icon.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-base font-semibold leading-none">Kharcha</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Track. Save. Grow.</p>
          </div>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-semibold">
            {letters}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <NavItems
          className="flex flex-col gap-1 overflow-y-auto px-3"
          itemClass="flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm font-medium"
        />

        <div className="mt-auto p-4">
          <div className="overflow-hidden rounded-2xl bg-cream px-4 pb-3 pt-2">
            <img src="/banner.png" alt="" className="mx-auto h-24 w-full object-contain" />
            <p className="text-xs font-medium">Keep tracking, keep growing</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Your small steps today build your big future.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-3 flex min-h-[44px] w-full items-center gap-2 rounded-2xl px-3 text-sm text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <img src="/kharcha-icon.png" alt="" className="h-7 w-7 rounded-lg object-contain" />
            <p className="text-base font-semibold">Kharcha</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ReminderBell />
            <button
              type="button"
              onClick={() => signOut()}
              className="px-2 text-sm text-muted-foreground md:hidden"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="px-4 pb-32 pt-2 md:px-8 md:pb-10">
          <PageEnter>
            <Outlet />
          </PageEnter>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        <NavItems
          compact
          className="no-scrollbar flex overflow-x-auto"
          itemClass="flex min-h-[52px] min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-none text-[10px]"
        />
      </nav>
    </div>
  );
}
