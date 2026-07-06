import { useEffect, useState } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { Dashboard } from './components/Dashboard'
import { ExpenseLogger } from './components/ExpenseLogger'
import { Layout } from './components/Layout'
import { Onboarding } from './components/Onboarding'
import { Settings } from './components/Settings'
import { SponsorReview } from './components/SponsorReview'
import { Wishlist } from './components/Wishlist'
import { useAuth } from './context/AuthContext'
import { useAppData } from './hooks/useAppData'
import type { Tab } from './types'

function App() {
  const { user, loading, login, register, logout, refreshUser } = useAuth()
  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  const effectiveViewId = viewUserId ?? user?.userId ?? null
  const app = useAppData(effectiveViewId)

  useEffect(() => {
    if (user?.userId) setViewUserId(user.userId)
  }, [user?.userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onLogin={login} onRegister={register} />
  }

  if (!user.profile.onboardingComplete) {
    return (
      <Onboarding
        defaultName={user.profile.name}
        onComplete={async (data) => {
          await app.completeOnboarding(data)
          await refreshUser()
        }}
      />
    )
  }

  if (app.loading || !app.profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">{app.error ?? 'Loading your data…'}</p>
      </div>
    )
  }

  const isOwnView = app.profileData.isOwnProfile
  const viewName = app.profileData.profile.name

  const handleSwitchView = (userId: string) => {
    const isOwn = userId === user.userId
    const isDependant = user.dependants.some((d) => d.userId === userId)
    if (!isOwn && !isDependant) return
    setViewUserId(userId)
    setActiveTab('dashboard')
  }

  return (
    <Layout
      user={user}
      viewUserId={effectiveViewId!}
      viewUserName={viewName}
      isOwnView={isOwnView}
      activeTab={activeTab}
      pendingReviewCount={user.pendingReviewCount}
      onTabChange={setActiveTab}
      onSwitchView={handleSwitchView}
      onLogout={logout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard data={app.profileData} readOnly={!isOwnView} />
      )}
      {activeTab === 'log' && isOwnView && (
        <ExpenseLogger
          data={app.profileData}
          onAdd={(amount, date, category, pillar, note) =>
            app.addTransaction({ amount, date, category, pillar, note })
          }
          onDelete={app.deleteTransaction}
        />
      )}
      {activeTab === 'wishlist' && isOwnView && (
        <Wishlist
          data={app.profileData}
          onAdd={app.addWishlistItem}
          onAllocate={app.allocateToWishlist}
          onRemove={app.removeWishlistItem}
          onToggleAutoAllocate={(enabled) => app.updateProfile({ auto_allocate_wants: enabled })}
        />
      )}
      {activeTab === 'review' && isOwnView && user.isSponsor && app.pendingReview && (
        <SponsorReview
          pending={app.pendingReview}
          onApproveTransaction={(id) => app.reviewTransaction(id, true)}
          onRejectTransaction={(id) => app.reviewTransaction(id, false)}
          onApproveWishlist={(id) => app.reviewWishlistItem(id, true)}
          onRejectWishlist={(id) => app.reviewWishlistItem(id, false)}
        />
      )}
      {activeTab === 'settings' && isOwnView && (
        <Settings
          user={user}
          onUpdateProfile={app.updateProfile}
          onSendInvitation={app.sendInvitation}
          onAcceptInvitation={app.acceptInvitation}
        />
      )}
    </Layout>
  )
}

export default App
