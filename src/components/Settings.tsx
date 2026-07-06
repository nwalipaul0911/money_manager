import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { RELATIONSHIP_OPTIONS } from '../constants'
import type { FixedExpense, RelationshipType, UserContext } from '../types'
import { formatCurrency, sumFixedExpenses } from '../utils/calculations'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { MoneyInput } from './ui/MoneyInput'

interface SettingsProps {
  user: UserContext
  onUpdateProfile: (patch: Record<string, unknown>) => Promise<void>
  onSendInvitation: (email: string, relationship: RelationshipType) => Promise<void>
  onAcceptInvitation: (token: string) => Promise<void>
}

export function Settings({
  user,
  onUpdateProfile,
  onSendInvitation,
  onAcceptInvitation,
}: SettingsProps) {
  const profile = user.profile
  const [income, setIncome] = useState(String(profile.netIncome))
  const [wantsPercent, setWantsPercent] = useState(String(profile.wantsBudgetPercent))
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRelationship, setInviteRelationship] = useState<RelationshipType>('parent')
  const [pendingInvites, setPendingInvites] = useState<Awaited<ReturnType<typeof api.pendingInvitations>>>([])
  const [sentInvites, setSentInvites] = useState<Awaited<ReturnType<typeof api.sentInvitations>>>([])

  useEffect(() => {
    api.pendingInvitations().then(setPendingInvites).catch(() => {})
    api.sentInvitations().then(setSentInvites).catch(() => {})
  }, [user])

  const saveIncome = () => {
    const val = parseFloat(income)
    if (val > 0) onUpdateProfile({ net_income: val })
  }

  const saveWantsPercent = () => {
    const val = parseFloat(wantsPercent)
    if (val >= 10 && val <= 70) onUpdateProfile({ wants_budget_percent: val })
  }

  const addExpense = () => {
    const amount = parseFloat(expenseAmount)
    if (!expenseName.trim() || !amount || amount <= 0) return
    const expense: FixedExpense = { id: crypto.randomUUID(), name: expenseName.trim(), amount }
    onUpdateProfile({ fixed_expenses: [...profile.fixedExpenses, expense] })
    setExpenseName('')
    setExpenseAmount('')
  }

  const removeExpense = (id: string) => {
    onUpdateProfile({ fixed_expenses: profile.fixedExpenses.filter((e) => e.id !== id) })
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    await onSendInvitation(inviteEmail.trim(), inviteRelationship)
    setInviteEmail('')
    const sent = await api.sentInvitations()
    setSentInvites(sent)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-text-muted text-sm mt-1">Manage your budget and network</p>
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Income & Budget</h3>
        <div className="space-y-4">
          <MoneyInput label="Monthly net income" value={income} onChange={setIncome} />
          <Button size="sm" variant="secondary" onClick={saveIncome}>Save</Button>
          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-medium text-text-muted">Wants budget ({wantsPercent}%)</label>
            <input type="range" min="10" max="70" step="5" value={wantsPercent} onChange={(e) => setWantsPercent(e.target.value)} className="w-full accent-wants" />
          </div>
          <Button size="sm" variant="secondary" onClick={saveWantsPercent}>Save wants %</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Fixed Expenses ({formatCurrency(sumFixedExpenses(profile))}/mo)</h3>
        <div className="flex gap-2 mb-4">
          <input className="flex-1 text-sm" placeholder="Name" value={expenseName} onChange={(e) => setExpenseName(e.target.value)} />
          <input type="number" className="w-24 text-sm" placeholder="Amt" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={addExpense}>Add</Button>
        </div>
        <ul className="space-y-2">
          {profile.fixedExpenses.map((e) => (
            <li key={e.id} className="flex justify-between items-center bg-surface-overlay rounded-lg px-3 py-2 text-sm">
              <span>{e.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-text-muted">{formatCurrency(e.amount)}</span>
                <button onClick={() => removeExpense(e.id)} className="text-text-muted hover:text-danger text-xs">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {pendingInvites.length > 0 && (
        <Card className="border-income/30">
          <h3 className="font-semibold mb-4">Pending Invitations</h3>
          <ul className="space-y-3">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="bg-surface-overlay rounded-lg p-3 text-sm">
                <p><span className="font-medium">{inv.sponsorName}</span> invited you as their {inv.relationship}</p>
                <Button size="sm" className="mt-2" onClick={() => onAcceptInvitation(inv.token).then(() => api.pendingInvitations().then(setPendingInvites))}>
                  Accept
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-4">Invite to Network</h3>
        <p className="text-xs text-text-muted mb-3">
          Send an invitation by email. When they register and accept, you become their sponsor.
        </p>
        <div className="space-y-3">
          <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="their@email.com" className="w-full text-sm" />
          <select value={inviteRelationship} onChange={(e) => setInviteRelationship(e.target.value as RelationshipType)} className="w-full text-sm">
            {RELATIONSHIP_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
            ))}
          </select>
          <Button size="sm" variant="secondary" className="w-full" disabled={!inviteEmail.trim()} onClick={handleInvite}>
            Send Invitation
          </Button>
        </div>
        {sentInvites.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-border pt-4">
            {sentInvites.map((inv) => (
              <li key={inv.id} className="text-sm text-text-muted">
                Pending: {inv.inviteeEmail} ({inv.relationship})
              </li>
            ))}
          </ul>
        )}
      </Card>

      {user.sponsors.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Your Sponsors</h3>
          <ul className="space-y-2">
            {user.sponsors.map((s) => (
              <li key={s.userId} className="text-sm bg-surface-overlay rounded-lg px-3 py-2">
                {s.name} · {s.email}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {user.dependants.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Your Dependants</h3>
          <ul className="space-y-2">
            {user.dependants.map((d) => (
              <li key={d.userId} className="text-sm bg-surface-overlay rounded-lg px-3 py-2">
                {d.name} · {d.email}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
