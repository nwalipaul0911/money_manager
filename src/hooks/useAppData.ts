import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { PendingReview, ProfileData } from '../types'
import { useRealtime } from './useRealtime'

export function useAppData(viewUserId: string | null) {
  const { user, refreshUser } = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveUserId = viewUserId ?? user?.userId ?? null

  const loadProfileData = useCallback(async (userId: string) => {
    const data = await api.getProfileData(userId)
    setProfileData(data)
    return data
  }, [])

  const loadPendingReview = useCallback(async () => {
    if (!user?.isSponsor) {
      setPendingReview(null)
      return
    }
    const data = await api.pendingReview()
    setPendingReview(data)
    return data
  }, [user?.isSponsor])

  const refresh = useCallback(async () => {
    if (!effectiveUserId) return
    setError(null)
    try {
      await Promise.all([loadProfileData(effectiveUserId), loadPendingReview(), refreshUser()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    }
  }, [effectiveUserId, loadProfileData, loadPendingReview, refreshUser])

  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => refreshRef.current(), 150)
  }, [])

  useRealtime(debouncedRefresh, Boolean(user?.profile.onboardingComplete))

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    if (!effectiveUserId) {
      setProfileData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [effectiveUserId, refresh])

  const mutate = async (fn: () => Promise<unknown>) => {
    await fn()
    await refresh()
  }

  return {
    user,
    profileData,
    pendingReview,
    loading,
    error,
    refresh,
    completeOnboarding: (data: Parameters<typeof api.completeOnboarding>[0]) =>
      mutate(() => api.completeOnboarding(data)),
    updateProfile: (patch: Record<string, unknown>) => mutate(() => api.updateProfile(patch)),
    addTransaction: (data: Parameters<typeof api.createTransaction>[0]) =>
      mutate(() => api.createTransaction(data)),
    deleteTransaction: (id: string) => mutate(() => api.deleteTransaction(id)),
    reviewTransaction: (id: string, approved: boolean) =>
      mutate(() => api.reviewTransaction(id, approved)),
    addWishlistItem: (name: string, targetAmount: number) =>
      mutate(() => api.createWishlistItem(name, targetAmount)),
    removeWishlistItem: (id: string) => mutate(() => api.deleteWishlistItem(id)),
    reviewWishlistItem: (id: string, approved: boolean) =>
      mutate(() => api.reviewWishlistItem(id, approved)),
    allocateToWishlist: (itemId: string, amount: number) =>
      mutate(() => api.allocateWishlist(itemId, amount)),
    sendInvitation: (email: string, relationship: string) =>
      mutate(() => api.createInvitation(email, relationship)),
    acceptInvitation: (token: string) => mutate(() => api.acceptInvitation(token)),
    removeLink: (linkId: string) => mutate(() => api.removeLink(linkId)),
  }
}
