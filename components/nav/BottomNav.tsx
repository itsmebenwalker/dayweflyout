'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Search, Bookmark } from 'lucide-react'

const tabs = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Find', icon: Search, href: '/find' },
  { label: 'Roster', icon: CalendarDays, href: '/roster' },
  { label: 'Saved', icon: Bookmark, href: '/saved' },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map(({ label, icon: Icon, href }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <Icon
                size={24}
                strokeWidth={1.5}
                className={active ? 'text-sky-400' : 'text-slate-500'}
              />
              <span className={`text-xs ${active ? 'text-sky-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
