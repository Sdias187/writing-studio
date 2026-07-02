import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  initialized: boolean
  error: string | null

  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string, lastName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  initialized: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return

    const { data } = await supabase.auth.getSession()

    set({
      session: data.session,
      user: data.session?.user ?? null,
      isLoading: false,
      initialized: true,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      })
    })
  },

  signIn: async (email: string, password: string) => {
    set({ error: null, isLoading: true })

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }

    set({ isLoading: false })
  },

  signUp: async (email: string, password: string, name?: string, lastName?: string) => {
    set({ error: null, isLoading: true })

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name ?? "",
          last_name: lastName ?? "",
        },
      },
    })

    if (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }

    set({ isLoading: false })
  },

  resetPassword: async (email: string) => {
    set({ error: null, isLoading: true })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }

    set({ isLoading: false })
  },

  signOut: async () => {
    set({ error: null })
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },

  clearError: () => set({ error: null }),
}))
