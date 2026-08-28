import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { supabase, type Game, type Shikigami } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowLeft, BookOpen, Gauge, Swords, Sparkles, Trophy } from "lucide-react"
import { useDocumentTitle } from "@/lib/seo"
import { Comments } from "@/components/Comments"
import { useAuth } from "@/context/AuthContext"

/** 图片加载失败时的占位（透明 1x1） */
const BROKEN_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

const rarityBadge: Record<Shikigami["rarity"], string> = {
  SP: "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/50 ring-1 ring-purple-200/40",
  SSR: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/50 ring-1 ring-amber-200/40",
  SR: "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-blue-500/50 ring-1 ring-sky-200/40",
  R: "bg-gradient-to-r from-zinc-500 to-slate-600 text-white shadow-md shadow-zinc-500/40 ring-1 ring-zinc-300/40",
}

const rarityGradient: Record<Shikigami["rarity"], string> = {
  SP: "from-purple-500/80 to-fuchsia-700/70",
  SSR: "from-amber-500/80 to-yellow-700/70",
  SR: "from-sky-500/80 to-blue-700/70",
  R: "from-zinc-400/70 to-slate-600/70",
}

const rarityHeaderBorder: Record<Shikigami["rarity"], string> = {
  SP: "border-purple-500/40 shadow-purple-500/10",
  SSR: "border-amber-500/40 shadow-amber-500/10",
  SR: "border-sky-500/40 shadow-blue-500/10",
  R: "border-zinc-500/40 shadow-zinc-500/10",
}

const sections = [
  { key: "cultivate", label: "培养方式", icon: BookOpen },
  { key: "yuhun", label: "御魂推荐", icon: Sparkles },
  { key: "panel", label: "毕业面板", icon: Gauge },
  { key: "pve", label: "PVE 就业", icon: Swords },
  { key: "pvp", label: "PVP 就业", icon: Trophy },
] as const

export function ShikigamiDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const { profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [shikigami, setShikigami] = useState<Shikigami | null>(null)
  const [related, setRelated] = useState<Shikigami[]>([])
  const [loading, setLoading] = useState(true)

  useDocumentTitle(
    shikigami?.name,
    shikigami ? `${shikigami.name}（${shikigami.rarity}）式神攻略 - ${game?.name ?? ""}` : undefined
  )

  useEffect(() => {
    if (!id || !slug) return
    setLoading(true)
    ;(async () => {
      const [{ data: g }, { data: s }] = await Promise.all([
        supabase.from("games").select("*").eq("slug", slug).maybeSingle(),
        supabase.from("shikigami").select("*").eq("id", id).maybeSingle(),
      ])
      const shikigamiData = (s as Shikigami) ?? null
      setGame((g as Game) ?? null)
      setShikigami(shikigamiData)

      // B3：相关式神（同栏目同定位）
      if (shikigamiData && shikigamiData.type) {
        const { data: rel } = await supabase
          .from("shikigami")
          .select("*")
          .eq("game_id", shikigamiData.game_id)
          .eq("type", shikigamiData.type)
          .neq("id", shikigamiData.id)
          .limit(4)
        setRelated((rel as Shikigami[] | null) ?? [])
      }
      setLoading(false)
    })()
  }, [id, slug])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="flex gap-6">
          <Skeleton className="h-64 w-48 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!shikigami || !game) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-muted-foreground">
        式神不存在
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        to={`/game/${game.slug}/shikigami`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回式神图鉴
      </Link>

      <Card className={cn("mb-6 border-2 shadow-lg", rarityHeaderBorder[shikigami.rarity])}>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
          <div className={cn(
            "h-56 w-44 shrink-0 overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-muted to-background ring-1 ring-black/5",
            !shikigami.image_url && rarityGradient[shikigami.rarity]
          )}>
            {shikigami.image_url ? (
              <img
                src={shikigami.image_url}
                alt={shikigami.name}
                loading="lazy"
                onError={(e) => {
                  const el = e.currentTarget
                  if (el.src !== BROKEN_IMG) el.src = BROKEN_IMG
                }}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-8xl font-bold text-white/95 drop-shadow-2xl">
                  {shikigami.name.slice(0, 1)}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold drop-shadow-sm">{shikigami.name}</h1>
              <Badge className={cn("px-3 py-1 text-sm font-bold tracking-wider", rarityBadge[shikigami.rarity])}>
                {shikigami.rarity}
              </Badge>
              {shikigami.type && (
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  {shikigami.type}
                </Badge>
              )}
            </div>
            {/* B3：扩展信息 */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {shikigami.attribute && <span>属性：<span className="font-medium text-foreground">{shikigami.attribute}</span></span>}
              {shikigami.cv && <span>声优：<span className="font-medium text-foreground">{shikigami.cv}</span></span>}
              {shikigami.version && <span>版本：<span className="font-medium text-foreground">{shikigami.version}</span></span>}
            </div>
            {shikigami.description && (
              <p className="text-base text-muted-foreground">{shikigami.description}</p>
            )}
            {shikigami.biography && (
              <p className="text-sm leading-relaxed text-muted-foreground">{shikigami.biography}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {sections.map(({ key, label, icon: Icon }) => {
          const content = shikigami[key]
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {content ? (
                  <div className="prose prose-slate max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无内容</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* B3：相关式神 */}
      {related.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-semibold">同定位推荐</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} to={`/game/${game.slug}/shikigami/${r.id}`}>
                <Card className={cn("group cursor-pointer overflow-hidden border-2 transition-all hover:-translate-y-1", rarityHeaderBorder[r.rarity])}>
                  <div className={cn("aspect-square overflow-hidden bg-gradient-to-br from-muted to-background", !r.image_url && rarityGradient[r.rarity])}>
                    {r.image_url ? (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-white/90">
                        {r.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.type}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 实体化评论 */}
      <Comments
        targetType="shikigami"
        targetId={shikigami.id}
        canModerate={profile?.role === "super_admin" || profile?.role === "global_editor"}
      />
    </div>
  )
}
