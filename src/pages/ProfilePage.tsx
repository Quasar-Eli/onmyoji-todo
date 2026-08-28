import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Camera, LogOut, Save } from "lucide-react"
import { validateUsername, checkSensitiveRemote } from "@/lib/sensitive"
import { useDocumentTitle } from "@/lib/seo"

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

/** 校验头像文件：类型与大小 */
const validateAvatarFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) return "请选择图片文件"
  if (file.size > MAX_AVATAR_SIZE) return "头像图片不能超过 2MB"
  return null
}

interface MyArticle {
  id: string
  title: string
  game_id: string
  game_name?: string
  game_slug?: string
  updated_at: string
}
interface MyComment {
  id: string
  content: string
  article_id: string
  article_title?: string
  created_at: string
}

export function ProfilePage() {
  const { user, profile, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()

  useDocumentTitle(profile?.username ? `${profile.username} · 个人设置` : "个人设置")

  const [username, setUsername] = useState(profile?.username ?? "")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [savingName, setSavingName] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgError, setMsgError] = useState<string | null>(null)

  // E3：个人数据
  const [myArticles, setMyArticles] = useState<MyArticle[]>([])
  const [myComments, setMyComments] = useState<MyComment[]>([])
  const [myFavorites, setMyFavorites] = useState<MyArticle[]>([])
  const [loadingMine, setLoadingMine] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoadingMine(true)
    ;(async () => {
      const [gRes, aRes, cRes, fRes] = await Promise.all([
        supabase.from("games").select("id, name, slug"),
        supabase.from("articles").select("id, title, game_id, updated_at").eq("created_by", user.id).order("updated_at", { ascending: false }).limit(50),
        supabase.from("comments").select("id, content, article_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("favorites").select("target_id").eq("user_id", user.id).eq("target_type", "article").order("created_at", { ascending: false }).limit(50),
      ])
      const games = (gRes.data ?? []) as { id: string; name: string; slug: string }[]
      const gmap = new Map(games.map((g) => [g.id, g]))

      const articles = (aRes.data ?? []) as MyArticle[]
      setMyArticles(articles.map((a) => ({ ...a, game_name: gmap.get(a.game_id)?.name, game_slug: gmap.get(a.game_id)?.slug })))

      // 评论关联文章标题
      const cData = (cRes.data ?? []) as MyComment[]
      const articleIds = [...new Set(cData.map((c) => c.article_id))]
      let titleMap: Record<string, string> = {}
      if (articleIds.length > 0) {
        const { data: arts } = await supabase.from("articles").select("id, title").in("id", articleIds)
        if (arts) titleMap = Object.fromEntries(arts.map((a) => [a.id, a.title]))
      }
      setMyComments(cData.map((c) => ({ ...c, article_title: titleMap[c.article_id] })))

      // 收藏关联文章
      const favIds = ((fRes.data ?? []) as { target_id: string }[]).map((f) => f.target_id)
      if (favIds.length > 0) {
        const { data: arts } = await supabase
          .from("articles")
          .select("id, title, game_id, updated_at")
          .in("id", favIds)
        setMyFavorites(((arts ?? []) as MyArticle[]).map((a) => ({ ...a, game_name: gmap.get(a.game_id)?.name, game_slug: gmap.get(a.game_id)?.slug })))
      } else {
        setMyFavorites([])
      }
      setLoadingMine(false)
    })()
  }, [user])

  // E4：每日签到
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [checking, setChecking] = useState(false)

  const loadCheckin = async () => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    const { data: todayRow } = await supabase
      .from("checkins")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
    const isChecked = !!todayRow
    setCheckedIn(isChecked)
    // 计算连续天数（今天未签则从昨天起算）
    const { data: rows } = await supabase
      .from("checkins")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(60)
    const dateSet = new Set((rows ?? []).map((r) => (r as { date: string }).date))
    const d = new Date()
    if (!isChecked) d.setDate(d.getDate() - 1)
    let count = 0
    while (dateSet.has(d.toISOString().slice(0, 10))) {
      count++
      d.setDate(d.getDate() - 1)
    }
    setStreak(count)
  }

  useEffect(() => {
    void loadCheckin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const doCheckin = async () => {
    if (!user || checkedIn) return
    setChecking(true)
    await supabase
      .from("checkins")
      .insert({ user_id: user.id, date: new Date().toISOString().slice(0, 10) })
    setChecking(false)
    await loadCheckin()
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center text-muted-foreground">
        请先登录。
      </div>
    )
  }

  const roleLabel =
    profile?.role === "super_admin"
      ? "超管"
      : profile?.role === "global_editor"
        ? "所有权限"
        : profile?.role === "game_admin"
          ? "栏目管理员"
          : "普通用户"

  /** E2：上传头像到 Storage 并更新资料 */
  const uploadAvatar = async (file: File) => {
    const fileError = validateAvatarFile(file)
    if (fileError) {
      setMsgError(fileError)
      setMsg(null)
      return
    }
    setUploading(true)
    setMsgError(null)
    setMsg(null)

    const ext = file.name.split(".").pop() ?? "png"
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" })

    if (upErr) {
      setUploading(false)
      setMsgError("头像上传失败：" + upErr.message)
      return
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
    const { error: ue } = await supabase
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("id", user.id)

    setUploading(false)
    if (ue) {
      setMsgError("头像更新失败：" + ue.message)
      return
    }
    await refreshProfile()
    setMsg("头像已更新")
  }

  /** E1：修改展示昵称 */
  const saveUsername = async () => {
    const localError = validateUsername(username)
    if (localError) {
      setUsernameError(localError)
      return
    }
    setSavingName(true)
    setUsernameError(null)
    setMsgError(null)

    const remoteHits = await checkSensitiveRemote(username)
    if (remoteHits.length > 0) {
      setSavingName(false)
      setUsernameError(`昵称包含敏感词：${remoteHits.join("、")}`)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id)

    setSavingName(false)
    if (error) {
      setUsernameError("保存失败：" + error.message)
      return
    }
    await refreshProfile()
    setMsg("昵称已更新")
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <AvatarFallback className="text-2xl">
                  {profile?.username?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadAvatar(file)
                  e.target.value = ""
                }}
              />
            </label>
          </div>
          <CardTitle className="mt-3 text-xl">{profile?.username}</CardTitle>
          <p className="text-sm text-muted-foreground">{roleLabel}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* E1：展示昵称 */}
          <div className="flex flex-col gap-1.5">
            <Label>展示昵称（2~20 字符）</Label>
            <Input
              value={username}
              maxLength={20}
              onChange={(e) => {
                setUsername(e.target.value)
                if (usernameError) setUsernameError(null)
              }}
              placeholder="输入新的展示昵称"
            />
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
            <Button
              onClick={() => void saveUsername()}
              disabled={savingName || username.trim() === profile?.username}
              className="w-full"
            >
              <Save className="h-4 w-4" />
              {savingName ? "保存中..." : "保存昵称"}
            </Button>
          </div>

          {msg && <p className="text-sm text-primary">{msg}</p>}
          {msgError && <p className="text-sm text-destructive">{msgError}</p>}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              void logout()
              navigate("/")
            }}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </CardContent>
      </Card>

      {/* E4：每日签到 */}
      <Card className="mt-6">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">每日签到</p>
            <p className="text-sm text-muted-foreground">
              {checkedIn ? `今日已签到 · 连续 ${streak} 天` : `今日未签到 · 连续 ${streak} 天`}
            </p>
          </div>
          <Button onClick={() => void doCheckin()} disabled={checkedIn || checking}>
            {checkedIn ? "已签到" : checking ? "签到中..." : "签到"}
          </Button>
        </CardContent>
      </Card>

      {/* E3：我的数据 */}
      <Tabs defaultValue="articles" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="articles" className="flex-1">我的文章</TabsTrigger>
          <TabsTrigger value="comments" className="flex-1">我的评论</TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1">我的收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="articles">
          <Card className="p-4">
            {loadingMine ? (
              <p className="py-6 text-center text-sm text-muted-foreground">加载中...</p>
            ) : myArticles.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">还没有发布过文章</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {myArticles.map((a) => (
                  <li key={a.id}>
                    <Link to={`/article/${a.id}`} className="flex items-center justify-between gap-3 py-2 transition-colors hover:text-primary">
                      <span className="min-w-0 truncate text-sm font-medium">{a.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {a.game_name} · {new Date(a.updated_at).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="p-4">
            {loadingMine ? (
              <p className="py-6 text-center text-sm text-muted-foreground">加载中...</p>
            ) : myComments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">还没有发表过评论</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {myComments.map((c) => (
                  <li key={c.id} className="py-2">
                    <Link to={`/article/${c.article_id}`} className="group">
                      <p className="line-clamp-2 text-sm">{c.content}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground group-hover:text-primary">
                        在「{c.article_title ?? "未知文章"}」 · {new Date(c.created_at).toLocaleString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card className="p-4">
            {loadingMine ? (
              <p className="py-6 text-center text-sm text-muted-foreground">加载中...</p>
            ) : myFavorites.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">还没有收藏，去逛逛吧</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {myFavorites.map((a) => (
                  <li key={a.id}>
                    <Link to={`/article/${a.id}`} className="flex items-center justify-between gap-3 py-2 transition-colors hover:text-primary">
                      <span className="min-w-0 truncate text-sm font-medium">{a.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.game_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
