const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'money-manager-token'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  register: (email: string, password: string, name: string) =>
    request<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<import('../types').UserContext>('/auth/me'),

  completeOnboarding: (data: {
    name: string
    net_income: number
    wants_budget_percent: number
    fixed_expenses: import('../types').FixedExpense[]
  }) =>
    request<import('../types').BudgetProfile>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (patch: Record<string, unknown>) =>
    request<import('../types').BudgetProfile>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  getProfileData: (userId: string) =>
    request<import('../types').ProfileData>(`/profiles/${userId}/data`),

  createInvitation: (email: string, relationship: string) =>
    request<import('../types').Invitation>('/network/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, relationship }),
    }),

  pendingInvitations: () => request<import('../types').Invitation[]>('/network/invitations/pending'),

  sentInvitations: () => request<import('../types').Invitation[]>('/network/invitations/sent'),

  acceptInvitation: (token: string) =>
    request<{ message: string }>(`/network/invitations/${token}/accept`, { method: 'POST' }),

  removeLink: (linkId: string) =>
    request<{ message: string }>(`/network/links/${linkId}`, { method: 'DELETE' }),

  createTransaction: (data: {
    amount: number
    date: string
    category: string
    pillar: string
    note?: string
  }) =>
    request<import('../types').Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),

  reviewTransaction: (id: string, approved: boolean) =>
    request<import('../types').Transaction>(`/transactions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    }),

  createWishlistItem: (name: string, targetAmount: number) =>
    request<import('../types').WishlistItem>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ name, targetAmount }),
    }),

  deleteWishlistItem: (id: string) =>
    request<{ message: string }>(`/wishlist/${id}`, { method: 'DELETE' }),

  reviewWishlistItem: (id: string, approved: boolean) =>
    request<import('../types').WishlistItem>(`/wishlist/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved }),
    }),

  allocateWishlist: (id: string, amount: number) =>
    request<import('../types').WishlistItem>(`/wishlist/${id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  pendingReview: () => request<import('../types').PendingReview>('/review/pending'),
}
