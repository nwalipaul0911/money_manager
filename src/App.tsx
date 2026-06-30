import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { ExpenseLogger } from './components/ExpenseLogger'
import { Layout } from './components/Layout'
import { Onboarding } from './components/Onboarding'
import { Settings } from './components/Settings'
import { Wishlist } from './components/Wishlist'
import { useAppState } from './hooks/useAppState'
import type { Tab } from './types'

function App() {
  const {
    state,
    update,
    completeOnboarding,
    addTransaction,
    deleteTransaction,
    addWishlistItem,
    allocateToWishlist,
    removeWishlistItem,
    resetApp,
  } = useAppState()

  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  if (!state.onboardingComplete) {
    return <Onboarding onComplete={completeOnboarding} />
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard state={state} />}
      {activeTab === 'log' && (
        <ExpenseLogger
          state={state}
          onAdd={addTransaction}
          onDelete={deleteTransaction}
        />
      )}
      {activeTab === 'wishlist' && (
        <Wishlist
          state={state}
          onAdd={addWishlistItem}
          onAllocate={allocateToWishlist}
          onRemove={removeWishlistItem}
          onToggleAutoAllocate={(enabled) => update({ autoAllocateWants: enabled })}
        />
      )}
      {activeTab === 'settings' && (
        <Settings state={state} onUpdate={update} onReset={resetApp} />
      )}
    </Layout>
  )
}

export default App
