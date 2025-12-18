'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NavBarProps {
  user: User
}

export default function NavBar({ user }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const navLinks = useMemo(
    () => [
      { href: '/today', label: 'Today' },
      { href: '/inbox', label: 'Inbox' },
      { href: '/suggestions', label: 'Suggestions' },
      { href: '/kids', label: 'Kids' },
      { href: '/activities', label: 'Activities' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/settings', label: 'Settings' },
    ],
    [],
  )

  const isActiveLink = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex min-w-0">
            <div className="flex-shrink-0 flex items-center min-w-0">
              <Link href="/today" className="text-xl font-bold text-blue-600">
                Kiddos
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <span className="hidden sm:inline text-sm text-gray-700 mr-4 max-w-[18rem] truncate">
              {user.email}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="mobile-user-menu"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:hidden"
              >
                <span className="sr-only">Open menu</span>
                {menuOpen ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleSignOut}
                className="hidden sm:inline text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: horizontally scrollable primary nav */}
      <div className="sm:hidden border-t bg-white/80 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto ios-scroll py-2 -mx-1 px-1">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium border ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile: user menu */}
      {menuOpen ? (
        <div id="mobile-user-menu" className="sm:hidden border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="text-sm text-gray-700 truncate">{user.email}</div>
            <div className="mt-3">
              <button
                onClick={handleSignOut}
                className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  )
}
