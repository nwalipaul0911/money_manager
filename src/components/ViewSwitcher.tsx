import type { UserContext } from '../types'

interface ViewSwitcherProps {
  user: UserContext
  viewUserId: string
  onSwitch: (userId: string) => void
}

export function ViewSwitcher({ user, viewUserId, onSwitch }: ViewSwitcherProps) {
  const views: { userId: string; name: string; icon: string }[] = [
    { userId: user.userId, name: user.profile.name, icon: '👤' },
    ...user.dependants.map((d) => ({
      userId: d.userId,
      name: d.name,
      icon: '🧒',
    })),
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {views.map((v) => {
        const isActive = v.userId === viewUserId
        return (
          <button
            key={v.userId}
            onClick={() => onSwitch(v.userId)}
            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? v.userId === user.userId
                  ? 'bg-income text-surface'
                  : 'bg-wants text-white'
                : 'bg-surface-overlay text-text-muted hover:text-text'
            }`}
          >
            {v.icon} {v.userId === user.userId ? 'Me' : v.name}
          </button>
        )
      })}
    </div>
  )
}
