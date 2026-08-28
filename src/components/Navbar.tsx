import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { Gamepad2, LayoutDashboard, LogOut, Moon, Search, Settings, Sun, User, Wrench } from "lucide-react"
import { useTheme } from "@/lib/theme"

interface Notification {
  id: string
  type: "comment" | "reply" | "article_like" | "comment_like"
  target_type: "article" | "comment"
  target_id: string
  read_at: string | null
  created_at: string
}

const NOTIF_TEXT: Record<Notification["type"], string> = {
  comment: "评论了你的词条",
  reply: "回复了你的评论",
  article_like: "赞了你的词条",
  comment_like: "赞了你的评论",
}

export function Navbar() {
  const { user, profile, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const loadNotifs = async () => {
    if (!user) return
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ])
    setNotifs((data as Notification[] | null) ?? [])
    setUnread(count ?? 0)
  }

  useEffect(() => {
    void loadNotifs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  /** C3：点击通知 → 全部标记已读 + 跳转目标 */
  const openNotification = async (n: Notification) => {
    await supabase.rpc("mark_notifications_read")
    setNotifOpen(false)
    setUnread(0)
    let href = "/"
    if (n.target_type === "article") {
      href = `/article/${n.target_id}`
    } else {
      const { data } = await supabase
        .from("comments")
        .select("article_id")
        .eq("id", n.target_id)
        .maybeSingle()
      if (data) href = `/article/${(data as { article_id: string }).article_id}`
    }
    void loadNotifs()
    navigate(href)
  }

  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <span>游戏Wiki</span>
        </Link>

        <nav className="flex items-center gap-1">
          {/* 全站搜索入口 */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild title="全站搜索">
            <Link to="/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          {/* 工具中心入口 */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild title="工具中心">
            <Link to="/tools">
              <Wrench className="h-4 w-4" />
            </Link>
          </Button>
          {/* F1：暗黑模式切换 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggle}
            title={theme === "dark" ? "切换到亮色模式" : "切换到暗黑模式"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              {/* C3：通知 */}
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                  <User className="sr-only" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>通知</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifs.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">暂无通知</p>
                  ) : (
                    notifs.map((n) => (
                      <DropdownMenuItem key={n.id} onClick={() => void openNotification(n)} className="cursor-pointer">
                        <div className="flex w-full flex-col gap-0.5 py-1">
                          <span className="text-sm font-medium">
                            {n.read_at ? "" : "● "}
                            {NOTIF_TEXT[n.type]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar>
                    <AvatarFallback>
                      {profile?.username?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline">{profile?.username ?? "用户"}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {profile?.username ?? "未登录"}
                    {profile && profile.role !== "user" && (
                      <span className="ml-1 text-xs text-primary">
                        {profile.role === "super_admin" ? "(超管)" : "(管理员)"}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <Settings className="h-4 w-4" />
                    个人设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    管理后台
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      void logout()
                      navigate("/")
                    }}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <User className="h-4 w-4" />
                  登录
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">注册</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
