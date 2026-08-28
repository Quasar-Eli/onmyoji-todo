import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase, type Game } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/lib/seo"
import { Eye, Gamepad2, Megaphone, Tag, Users } from "lucide-react"

interface HotArticle {
  id: string
  title: string
  game_id: string
  game_name?: string
  game_slug?: string
  view_count?: number
  updated_at: string
}

interface Announcement {
  id: string
  title: string
  content: string
  pinned: boolean
  published_at: string
}

export function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [latest, setLatest] = useState<HotArticle[]>([])
  const [hot, setHot] = useState<HotArticle[]>([])
  const [hotTags, setHotTags] = useState<{ tag: string; count: number }[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useDocumentTitle("多游戏 Wiki 中心", "浏览各游戏的攻略、图鉴与词条")

  useEffect(() => {
    ;(async () => {
      const [gRes] = await Promise.all([
        supabase.from("games").select("*").order("created_at"),
      ])
      setGames((gRes.data as Game[]) ?? [])

      // 最新更新 / 本周热词（前 6 条）
      const [latRes, hotRes, tagRes, annRes] = await Promise.all([
        supabase.from("articles").select("id, title, game_id, updated_at").order("updated_at", { ascending: false }).limit(6),
        supabase.from("articles").select("id, title, game_id, view_count").gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("view_count", { ascending: false }).limit(6),
        supabase.from("articles").select("tags").limit(1000),
        supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(3),
      ])
      const gameMap = new Map((gRes.data as Game[] | null)?.map((g) => [g.id, g]) ?? [])
      const withGame = (rows: { id: string; title: string; game_id: string; view_count?: number; updated_at?: string }[]): HotArticle[] =>
        rows.map((r) => {
          const g = gameMap.get(r.game_id)
          return {
            id: r.id,
            title: r.title,
            game_id: r.game_id,
            game_name: g?.name,
            game_slug: g?.slug,
            view_count: r.view_count,
            updated_at: r.updated_at ?? "",
          }
        })
      setLatest(withGame((latRes.data as never[] ?? []) as { id: string; title: string; game_id: string; updated_at?: string }[]))
      setHot(withGame((hotRes.data as never[] ?? []) as { id: string; title: string; game_id: string; view_count?: number }[]))
      setAnnouncements((annRes.data as Announcement[] | null) ?? [])

      // 热门标签：聚合最近文章的 tags 计数
      const counts = new Map<string, number>()
      for (const row of (tagRes.data ?? []) as { tags?: string[] }[]) {
        for (const t of row.tags ?? []) {
          counts.set(t, (counts.get(t) ?? 0) + 1)
        }
      }
      setHotTags(
        [...counts.entries()]
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12)
      )
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Skeleton className="mx-auto mb-6 h-12 w-2/3" />
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-5xl">
          <Gamepad2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-wide">多游戏 Wiki 中心</h1>
        <p className="mt-2 text-muted-foreground">
          浏览各游戏的攻略、图鉴与词条，一站式查阅
        </p>
      </div>

      {/* G2：站点公告 */}
      {announcements.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {announcements.map((a) => (
            <Card key={a.id} className={a.pinned ? "border-primary/40" : ""}>
              <div className="flex items-start gap-3 p-4">
                <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.title}</span>
                    {a.pinned && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">置顶</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.published_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {a.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* A1：最新更新 / 本周热词 */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4 text-primary" />
            最新更新
          </h2>
          {latest.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">暂无内容</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {latest.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/article/${a.id}`}
                    className="flex items-center justify-between gap-3 py-2 transition-colors hover:text-primary"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{a.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      {a.game_name && <span>{a.game_name}</span>}
                      <span>{a.updated_at ? new Date(a.updated_at).toLocaleDateString() : ""}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Eye className="h-4 w-4 text-primary" />
            本周热词
          </h2>
          {hot.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">暂无数据</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {hot.map((a, i) => (
                <li key={a.id}>
                  <Link
                    to={`/article/${a.id}`}
                    className="flex items-center gap-3 py-2 transition-colors hover:text-primary"
                  >
                    <span className="w-5 shrink-0 text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {(a.view_count ?? 0).toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* A1：热门标签 */}
      {hotTags.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Tag className="h-4 w-4 text-primary" />
            热门标签
          </h2>
          <div className="flex flex-wrap gap-2">
            {hotTags.map(({ tag, count }) => (
              <Link
                key={tag}
                to={`/search?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground transition-colors hover:bg-accent"
              >
                {tag}
                <span className="ml-1 text-xs text-muted-foreground">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 栏目入口 */}
      {games.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          还没有游戏，等待超管添加。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.id} to={`/game/${game.slug}`}>
              <Card
                className="group h-40 cursor-pointer p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: game.accent_color ?? undefined }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{game.icon ?? "🎮"}</span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold">{game.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {game.description || "暂无描述"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: game.accent_color ?? undefined }}>
                    进入 Wiki →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
