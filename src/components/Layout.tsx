import type { Tab } from '../types'

interface LayoutProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  children: React.ReactNode
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '◉' },
  { id: 'log', label: 'Log', icon: '+' },
  { id: 'wishlist', label: 'Wishlist', icon: '★' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-income/20 text-income flex items-center justify-center font-bold text-sm">
            $
          </div>
          <h1 className="font-bold text-lg">Money Manager</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-surface-raised/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                activeTab === tab.id
                  ? 'text-income'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
