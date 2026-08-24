import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { supabase, type Profile, type Role } from "@/lib/supabase"

interface AuthState {
  user: { id: string; email?: string; username?: string } | null
  profile: Profile | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ error: string | null }>
  register: (username: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/** 用户名 -> 内部邮箱映射（自用项目，不需要真实邮箱） */
const toEmail = (username: string) => `${username}@local.wiki`

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u ? { id: u.id, email: u.email } : null)
      if (u) fetchProfile(u.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u ? { id: u.id, email: u.email } : null)
      if (u) fetchProfile(u.id)
      else setProfile(null)
    })

    return () => sub.subscription.unsubscribe()
  }, [fetchProfile])

  const login = useCallback(async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    })
    return { error: error?.message ?? null }
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: toEmail(username),
      password,
      options: { data: { username } },
    })
    if (error) return { error: error.message }
    // 若邮箱确认已关闭，signUp 会直接返回 session
    if (data.user && !data.session) {
      return { error: "注册成功，请等待系统确认后登录" }
    }
    return { error: null }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value: AuthState = {
    user,
    profile,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useRole(): Role {
  const { profile } = useAuth()
  return profile?.role ?? "user"
}

export function useIsAdmin(): boolean {
  const role = useRole()
  return role === "super_admin" || role === "global_editor" || role === "game_admin"
}

export function useIsSuperAdmin(): boolean {
  return useRole() === "super_admin"
}

export function useIsGlobalEditor(): boolean {
  return useRole() === "global_editor"
}

/** 超管或所有权限用户（可管理所有栏目） */
export function useCanManageAll(): boolean {
  const role = useRole()
  return role === "super_admin" || role === "global_editor"
}