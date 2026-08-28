import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase, type Game } from "@/lib/supabase"
import { useIsSuperAdmin, useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings2, Plus, Trash2, Users, ShieldCheck, ShieldAlert, Swords, BookOpen, MessageSquare, TrendingUp, Megaphone, ScrollText } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useDocumentTitle } from "@/lib/seo"

interface GameAdmin {
  game_id: string
  user_id: string
  username: string
}

export function AdminPage() {
  const isSuper = useIsSuperAdmin()
  const { profile } = useAuth()

  useDocumentTitle("管理后台")
  const [games, setGames] = useState<Game[]>([])
  const [admins, setAdmins] = useState<GameAdmin[]>([])
  const [users, setUsers] = useState<{ id: string; username: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)

  // H1：仪表盘统计
  const [stats, setStats] = useState({ articles: 0, shikigami: 0, comments: 0, users: 0 })
  const [daily, setDaily] = useState<{ label: string; count: number }[]>([])

  // 表单
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("")
  const [accent, setAccent] = useState("#3b82f6")
  const [assignGameId, setAssignGameId] = useState("")
  const [assignUserId, setAssignUserId] = useState("")

  const load = async () => {
    // 近 7 天（含今天）用于条形图
    const days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)
      return d
    })
    const [{ data: g }, { data: ga }, { data: u }, aCount, sCount, cCount, recent] = await Promise.all([
      supabase.from("games").select("*").order("created_at"),
      supabase.from("game_admins").select("*"),
      supabase.from("profiles").select("id, username, role").order("username"),
      supabase.from("articles").select("*", { count: "exact", head: true }),
      supabase.from("shikigami").select("*", { count: "exact", head: true }),
      supabase.from("comments").select("*", { count: "exact", head: true }),
      supabase.from("articles").select("created_at").gte("created_at", days[0].toISOString()),
    ])
    setGames((g as Game[]) ?? [])
    setAdmins((ga as GameAdmin[]) ?? [])
    setUsers((u as { id: string; username: string; role: string }[]) ?? [])
    setStats({
      articles: aCount.count ?? 0,
      shikigami: sCount.count ?? 0,
      comments: cCount.count ?? 0,
      users: (u?.length ?? 0),
    })
    // 按日期聚合
    const counts = new Map<string, number>()
    for (const r of (recent?.data ?? []) as { created_at: string }[]) {
      const key = r.created_at.slice(0, 10)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    setDaily(
      days.map((d) => {
        const key = d.toISOString().slice(0, 10)
        return { label: `${d.getMonth() + 1}/${d.getDate()}`, count: counts.get(key) ?? 0 }
      })
    )
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const createGame = async () => {
    if (!name.trim() || !slug.trim()) return
    const { error } = await supabase
      .from("games")
      .insert({ name, slug, description, icon: icon || null, accent_color: accent })
    if (!error) {
      setName("")
      setSlug("")
      setDescription("")
      setIcon("")
      load()
    }
  }

  const deleteGame = async (id: string) => {
    await supabase.from("games").delete().eq("id", id)
    load()
  }

  const assignAdmin = async () => {
    if (!assignGameId || !assignUserId) return
    await supabase
      .from("game_admins")
      .upsert({ game_id: assignGameId, user_id: assignUserId })
    setAssignGameId("")
    setAssignUserId("")
    load()
  }

  const removeAdmin = async (gameId: string, userId: string) => {
    await supabase.from("game_admins").delete().eq("game_id", gameId).eq("user_id", userId)
    load()
  }

  const setGlobalEditor = async (userId: string, enable: boolean) => {
    await supabase
      .from("profiles")
      .update({ role: enable ? "global_editor" : "user" })
      .eq("id", userId)
    load()
  }

  const adminForGame = (gameId: string) =>
    admins.filter((a) => a.game_id === gameId)

  if (loading) return <p className="py-16 text-center text-muted-foreground">加载中...</p>

  if (!isSuper && profile?.role !== "game_admin" && profile?.role !== "global_editor") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        你没有访问管理后台的权限。
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">管理后台</h1>
        {isSuper && (
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/sensitive-words">
                <ShieldAlert className="h-4 w-4" />
                敏感词
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/announcements">
                <Megaphone className="h-4 w-4" />
                公告
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/data">
                <ScrollText className="h-4 w-4" />
                数据
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* H1：数据仪表盘 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "攻略词条", value: stats.articles, icon: BookOpen },
          { label: "式神图鉴", value: stats.shikigami, icon: Swords },
          { label: "累计评论", value: stats.comments, icon: MessageSquare },
          { label: "注册用户", value: stats.users, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-4 text-center">
            <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          近 7 日新增词条
        </h2>
        <div className="flex h-32 items-end gap-2">
          {daily.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-primary/70 transition-all"
                  style={{
                    height: d.count === 0 ? "2px" : `${Math.min(100, Math.max(8, (d.count / Math.max(1, ...daily.map((x) => x.count))) * 100))}%`,
                  }}
                  title={`${d.label}：${d.count} 篇`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {isSuper && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                添加游戏
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>游戏名称</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：阴阳师" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>URL 标识（slug）</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="如：onmyoji" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>描述</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="一句话介绍" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>图标（emoji）</Label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🎮" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>主题色</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
                  />
                  <Input value={accent} onChange={(e) => setAccent(e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={createGame} className="w-full">
                  创建游戏
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                分配管理员
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Select value={assignGameId} onValueChange={(v) => setAssignGameId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="选择游戏" getLabel={(v) => games.find((g) => g.id === v)?.name ?? v} /></SelectTrigger>
                <SelectContent>
                  {games.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assignUserId} onValueChange={(v) => setAssignUserId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="选择用户" getLabel={(v) => users.find((u) => u.id === v)?.username ?? v} /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={assignAdmin}>分配</Button>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                所有权限用户
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                拥有"所有权限"的用户可以编辑全部栏目的内容（但无法再授权给其他人）。
              </p>
              <div className="flex flex-col gap-2">
                {users.map((u) => {
                  const isGlobal = u.role === "global_editor"
                  const isSuper = u.role === "super_admin"
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{u.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {isSuper ? "超管" : isGlobal ? "所有权限" : "普通用户"}
                        </span>
                      </div>
                      {!isSuper && (
                        <Button
                          size="sm"
                          variant={isGlobal ? "outline" : "default"}
                          onClick={() => setGlobalEditor(u.id, !isGlobal)}
                        >
                          {isGlobal ? "取消权限" : "设为所有权限"}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-col gap-4">
        {games.map((game) => (
          <Card key={game.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{game.icon ?? "🎮"}</span>
                <div>
                  <h3 className="font-semibold">{game.name}</h3>
                  <p className="text-xs text-muted-foreground">{game.description || "暂无描述"}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {adminForGame(game.id).map((a) => (
                      <span
                        key={a.user_id}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
                      >
                        {a.username}
                        {isSuper && (
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeAdmin(game.id, a.user_id)}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {adminForGame(game.id).length === 0 && (
                      <span className="text-xs text-muted-foreground">暂无管理员</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/game/${game.id}`}>
                    <Settings2 className="h-4 w-4" />
                    词条
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/game/${game.id}/shikigami`}>
                    <Swords className="h-4 w-4" />
                    式神
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/game/${game.id}/items`}>
                    <BookOpen className="h-4 w-4" />
                    装备
                  </Link>
                </Button>
                {isSuper && (
                  <ConfirmDialog
                    title={`删除栏目"${game.name}"？`}
                    description="会同时删除其下所有分类、模块与内容，且不可恢复。"
                    onConfirm={() => deleteGame(game.id)}
                  >
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </ConfirmDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}