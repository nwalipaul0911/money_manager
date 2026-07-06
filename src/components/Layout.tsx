import type { Tab, UserContext } from '../types'
import { ViewSwitcher } from './ViewSwitcher'

interface LayoutProps {
  user: UserContext
  viewUserId: string
  viewUserName: string
  isOwnView: boolean
  activeTab: Tab
  pendingReviewCount: number
  onTabChange: (tab: Tab) => void
  onSwitchView: (userId: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export function Layout({
  user,
  viewUserId,
  viewUserName,
  isOwnView,
  activeTab,
  pendingReviewCount,
  onTabChange,
  onSwitchView,
  onLogout,
  children,
}: LayoutProps) {
  const hasNetwork = user.isSponsor || user.isDependant || user.dependants.length > 0

  const tabs: { id: Tab; label: string; icon: string; show: boolean }[] = [
    { id: 'dashboard', label: 'Home', icon: '◉', show: true },
    { id: 'log', label: 'Log', icon: '+', show: isOwnView },
    { id: 'wishlist', label: 'Wishlist', icon: '★', show: isOwnView },
    { id: 'review', label: 'Review', icon: '✓', show: user.isSponsor && isOwnView },
    { id: 'settings', label: 'Settings', icon: '⚙', show: isOwnView },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-income/20 text-income flex items-center justify-center font-bold text-sm">$</div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg leading-tight">Money Manager</h1>
              <p className="text-xs text-text-muted truncate">
                {isOwnView ? user.email : `Viewing ${viewUserName}'s dashboard`}
              </p>
            </div>
            <button onClick={onLogout} className="text-xs text-text-muted hover:text-danger shrink-0">Logout</button>
          </div>
          {hasNetwork && (
            <ViewSwitcher
              user={user}
              viewUserId={viewUserId}
              onSwitch={onSwitchView}
            />
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-surface-raised/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex">
          {tabs.filter((t) => t.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                activeTab === tab.id ? 'text-income' : 'text-text-muted hover:text-text'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'review' && pendingReviewCount > 0 && (
                <span className="absolute top-1.5 right-1/4 translate-x-2 bg-wishlist text-surface text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingReviewCount > 9 ? '9+' : pendingReviewCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
