import type { ComponentType, SVGProps } from 'react'
import { NavLink, Outlet } from 'react-router'
import {
  ChatIcon,
  DarkModeIcon,
  DashboardIcon,
  LightModeIcon,
  SystemModeIcon,
} from '@/components/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useTheme, type Theme } from '@/lib/theme'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const NAV: { to: string; label: string; icon: Icon }[] = [
  { to: '/', label: 'Chat', icon: ChatIcon },
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
]

const THEMES: { value: Theme; label: string; icon: Icon }[] = [
  { value: 'light', label: 'Light', icon: LightModeIcon },
  { value: 'dark', label: 'Dark', icon: DarkModeIcon },
  { value: 'system', label: 'System', icon: SystemModeIcon },
]

export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-5">
        <path
          d="M19 6v13a4 4 0 0 1-8 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}

const itemClass =
  'flex items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

function ThemeMenu({ side }: { side: 'right' | 'top' }) {
  const { theme, setTheme } = useTheme()
  const Current = THEMES.find((t) => t.value === theme)?.icon ?? SystemModeIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change theme"
        className={cn(itemClass, 'size-11 aria-expanded:bg-accent aria-expanded:text-foreground')}
      >
        <Current className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
            {THEMES.map(({ value, label, icon: I }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <I className="size-4" />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell() {
  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop: icon rail */}
      <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r bg-sidebar py-4 md:flex">
        <NavLink to="/" aria-label="JobPulse home" className="rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </NavLink>

        <nav aria-label="Main" className="mt-auto mb-auto flex flex-col gap-2">
          {NAV.map(({ to, label, icon: I }) => (
            <Tooltip key={to}>
              <TooltipTrigger
                render={
                  <NavLink
                    to={to}
                    end
                    aria-label={label}
                    className={({ isActive }) =>
                      cn(itemClass, 'size-11', isActive && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground')
                    }
                  />
                }
              >
                <I className="size-5" />
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <ThemeMenu side="right" />
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      {/* Mobile: bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-start justify-around border-t bg-background/90 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {NAV.map(({ to, label, icon: I }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'flex h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl px-3 text-[11px] font-medium text-muted-foreground transition-colors',
                isActive && 'text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <I className={cn('size-6 rounded-full px-3 py-0.5 box-content transition-colors', isActive && 'bg-accent')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <div className="flex h-12 items-center">
          <ThemeMenu side="top" />
        </div>
      </nav>
    </div>
  )
}
