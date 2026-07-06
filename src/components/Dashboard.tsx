import type { ProfileData } from '../types'
import {
  formatCurrency,
  getDiscretionaryPool,
  getSpendingSummary,
  getTransactionsForMonth,
  getUnspentWants,
  getWantsBudget,
  sumFixedExpenses,
} from '../utils/calculations'
import { statusColor, statusLabel } from '../utils/profiles'
import { Card } from './ui/Card'
import { ProgressBar } from './ui/ProgressBar'

interface DashboardProps {
  data: ProfileData
  readOnly?: boolean
}

export function Dashboard({ data, readOnly }: DashboardProps) {
  const { profile, transactions, needsApproval } = data
  const fixedTotal = sumFixedExpenses(profile)
  const discretionary = getDiscretionaryPool(profile)
  const wantsBudget = getWantsBudget(profile)
  const behavior = getSpendingSummary(profile, transactions)
  const unspentWants = getUnspentWants(profile, transactions)
  const recentTransactions = getTransactionsForMonth(transactions).slice(0, 5)
  const pendingCount = transactions.filter((t) => t.status === 'pending').length
  const needsBudget = discretionary - wantsBudget
  const needsRemaining = Math.max(0, needsBudget - behavior.needsSpent)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-text-muted text-sm mt-1">
          {readOnly ? `${profile.name}'s budget overview` : 'Your monthly budget overview'}
        </p>
      </div>

      {readOnly && (
        <Card className="border-border bg-surface-overlay">
          <p className="text-sm text-text-muted">Read-only view — only {profile.name} can log expenses on their account.</p>
        </Card>
      )}

      {needsApproval && pendingCount > 0 && !readOnly && (
        <Card className="border-wishlist/30 bg-wishlist/5">
          <p className="text-sm text-wishlist font-medium">
            {pendingCount} entr{pendingCount === 1 ? 'y' : 'ies'} waiting for sponsor approval
          </p>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-surface-raised to-surface-overlay">
        <p className="text-text-muted text-sm">{needsApproval ? 'Monthly Budget' : 'Net Income'}</p>
        <p className="text-3xl font-bold text-income mt-1">{formatCurrency(profile.netIncome)}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {!needsApproval && fixedTotal > 0 && (
            <div>
              <p className="text-text-muted">Fixed expenses</p>
              <p className="font-semibold text-danger">{formatCurrency(fixedTotal)}</p>
            </div>
          )}
          <div className={fixedTotal === 0 || needsApproval ? 'col-span-2' : ''}>
            <p className="text-text-muted">{needsApproval ? 'Spending pool' : 'Discretionary'}</p>
            <p className="font-semibold">{formatCurrency(discretionary)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-needs" />
            <h3 className="font-semibold">Needs</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(behavior.needsSpent)}</p>
          <p className="text-sm text-text-muted mt-1">
            of {formatCurrency(needsBudget)} budget · {formatCurrency(needsRemaining)} left
          </p>
          <ProgressBar value={needsBudget > 0 ? (behavior.needsSpent / needsBudget) * 100 : 0} color="needs" size="sm" />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-wants" />
            <h3 className="font-semibold">Wants</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(behavior.wantsSpent)}</p>
          <p className="text-sm text-text-muted mt-1">
            of {formatCurrency(wantsBudget)} budget · {formatCurrency(unspentWants)} unspent
          </p>
          <ProgressBar value={wantsBudget > 0 ? (behavior.wantsSpent / wantsBudget) * 100 : 0} color="wants" size="sm" />
        </Card>
      </div>

      {!needsApproval && unspentWants > 0 && !readOnly && (
        <Card className="border-wishlist/30 bg-wishlist/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-wishlist font-medium">Available for Wishlist</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(unspentWants)}</p>
            </div>
            <div className="text-3xl opacity-50">🎯</div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-6">No transactions this month.</p>
        ) : (
          <ul className="space-y-3">
            {recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.pillar === 'needs' ? 'bg-needs' : 'bg-wants'}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{t.category}</p>
                    <p className="text-xs text-text-muted">{t.date}</p>
                  </div>
                  {needsApproval && t.status !== 'approved' && (
                    <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${statusColor(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-sm shrink-0">{formatCurrency(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
