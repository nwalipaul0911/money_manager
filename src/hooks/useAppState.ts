import { useCallback, useEffect, useState } from 'react'
import { COOLING_OFF_HOURS } from '../constants'
import { defaultState, generateId, loadState, saveState } from '../storage'
import type { AppState, FixedExpense, Pillar, Transaction, WishlistAllocation, WishlistItem } from '../types'

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const completeOnboarding = useCallback(
    (netIncome: number, fixedExpenses: FixedExpense[], wantsBudgetPercent: number) => {
      update({
        onboardingComplete: true,
        netIncome,
        fixedExpenses,
        wantsBudgetPercent,
      })
    },
    [update],
  )

  const addTransaction = useCallback(
    (amount: number, date: string, category: string, pillar: Pillar, note?: string) => {
      const transaction: Transaction = {
        id: generateId(),
        amount,
        date,
        category,
        pillar,
        note,
      }
      setState((prev) => ({
        ...prev,
        transactions: [transaction, ...prev.transactions],
      }))
    },
    [],
  )

  const deleteTransaction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }))
  }, [])

  const addWishlistItem = useCallback((name: string, targetAmount: number) => {
    const now = new Date()
    const coolingOffUntil = new Date(now.getTime() + COOLING_OFF_HOURS * 60 * 60 * 1000)
    const item: WishlistItem = {
      id: generateId(),
      name,
      targetAmount,
      savedAmount: 0,
      createdAt: now.toISOString(),
      coolingOffUntil: coolingOffUntil.toISOString(),
    }
    setState((prev) => ({
      ...prev,
      wishlist: [item, ...prev.wishlist],
    }))
  }, [])

  const allocateToWishlist = useCallback((itemId: string, amount: number) => {
    const allocation: WishlistAllocation = {
      id: generateId(),
      itemId,
      amount,
      date: new Date().toISOString().split('T')[0],
    }
    setState((prev) => ({
      ...prev,
      wishlistAllocations: [...prev.wishlistAllocations, allocation],
      wishlist: prev.wishlist.map((item) =>
        item.id === itemId
          ? { ...item, savedAmount: Math.min(item.savedAmount + amount, item.targetAmount) }
          : item,
      ),
    }))
  }, [])

  const removeWishlistItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      wishlist: prev.wishlist.filter((item) => item.id !== id),
    }))
  }, [])

  const resetApp = useCallback(() => {
    setState({ ...defaultState })
  }, [])

  return {
    state,
    update,
    completeOnboarding,
    addTransaction,
    deleteTransaction,
    addWishlistItem,
    allocateToWishlist,
    removeWishlistItem,
    resetApp,
  }
}
