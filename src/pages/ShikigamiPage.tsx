import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game, type Rarity, type Shikigami } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { useDocumentTitle } from "@/lib/seo"

const RARITIES: Rarity[] = ["SP", "SSR", "SR", "R"]

const rarityBadge: Record<Rarity, string> = {
  SP: "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/50 ring-1 ring-purple-200/40",
  SSR: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/50 ring-1 ring-amber-200/40",
  SR: "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-blue-500/50 ring-1 ring-sky-200/40",
  R: "bg-gradient-to-r from-zinc-500 to-slate-600 text-white shadow-md shadow-zinc-500/40 ring-1 ring-zinc-300/40",
}

const rarityCard: Record<Rarity, string> = {
  SP: "border-purple-500/40 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/25",
  SSR: "border-amber-500/40 hover:border-amber-400/80 hover:shadow-xl hover:shadow-amber-500/25",
  SR: "border-sky-500/40 hover:border-sky-400/80 hover:shadow-xl hover:shadow-sky-500/25",
  R: "border-zinc-500/40 hover:border-zinc-400/80 hover:shadow-xl hover:shadow-zinc-500/25",
}

const rarityGradient: Record<Rarity, string> = {
  SP: "from-purple-500/80 to-fuchsia-700/70",
  SSR: "from-amber-500/80 to-yellow-700/70",
  SR: "from-sky-500/80 to-blue-700/70",
  R: "from-zinc-400/70 to-slate-600/70",
}

const rarityTypeText: Record<Rarity, string> = {
  SP: "text-purple-400",
  SSR: "text-amber-500",
  SR: "text-sky-400",
  R: "text-zinc-400",
}

const rarityRing: Record<Rarity, string> = {
  SP: "group-hover:ring-2 group-hover:ring-purple-400/40",
  SSR: "group-hover:ring-2 group-hover:ring-amber-400/40",
  SR: "group-hover:ring-2 group-hover:ring-sky-400/40",
  R: "group-hover:ring-2 group-hover:ring-zinc-400/40",
}

export function ShikigamiPage() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [list, setList] = useState<Shikigami[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeRarity, setActiveRarity] = useState<Rarity | "all">("all")
  const [activeType, setActiveType] = useState<string>("all")

  useDocumentTitle(
    game ? `${game.name} · 式神图鉴` : "式神图鉴",
    game ? `${game.name} 全部式神图鉴与培养攻略` : undefined
  )

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    ;(async () => {
      const { data: g } = await supabase
        .from("games")
        .select("*")
        .eq("slug", slug)
        .maybeSingle()
      if (!g) {
        setLoading(false)
        return
      }
      setGame(g as Game)
      const { data: s } = await supabase
        .from("shikigami")
        .select("*")
        .eq("game_id", (g as Game).id)
        .order("sort_order")
      setList((s as Shikigami[]) ?? [])
      setLoading(false)
    })()
  }, [slug])

  // B3：定位（type）筛选选项
  const types = useMemo(() => {
    const set = new Set<string>()
    list.forEach((s) => s.type && set.add(s.type))
    return [...set].sort()
  }, [list])

  const filtered = useMemo(() => {
    return list.filter((s) => {
      const matchRarity = activeRarity === "all" || s.rarity === activeRarity
      const matchType = activeType === "all" || s.type === activeType
      const matchQuery = s.name.toLowerCase().includes(query.toLowerCase())
      return matchRarity && matchType && matchQuery
    })
  }, [list, activeRarity, activeType, query])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-1/3" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 text-center text-muted-foreground">
        未找到该栏目
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">⚔️</span>
          <div>
            <h1 className="text-3xl font-bold">{game.name} · 式神图鉴</h1>
            <p className="mt-1 text-muted-foreground">
              共 {list.length} 位式神，点击卡片查看攻略
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索式神..."
            className="flex h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeRarity === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveRarity("all")}
          >
            全部
          </Button>
          {RARITIES.map((r) => (
            <Button
              key={r}
              variant={activeRarity === r ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRarity(r)}
            >
              {r}
            </Button>
          ))}
        </div>
        {types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveType("all")}
            >
              全部定位
            </Button>
            {types.map((t) => (
              <Button
                key={t}
                variant={activeType === t ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无式神</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((s) => (
            <Link key={s.id} to={`/game/${game.slug}/shikigami/${s.id}`}>
              <Card className={cn(
                "group cursor-pointer overflow-hidden border-2 transition-all duration-200 hover:-translate-y-1",
                rarityCard[s.rarity]
              )}>
                <div className={cn(
                  "relative aspect-square overflow-hidden bg-linear-to-br from-muted to-background ring-0 transition-all",
                  rarityRing[s.rarity]
                )}>
                  {s.image_url ? (
                    <img
                      src={s.image_url}
                      alt={s.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className={cn(
                      "flex h-full w-full items-center justify-center bg-linear-to-br",
                      rarityGradient[s.rarity]
                    )}>
                      <span className="text-7xl font-bold text-white/95 drop-shadow-2xl">
                        {s.name.slice(0, 1)}
                      </span>
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <Badge className={cn("px-2 py-0.5 text-xs font-bold tracking-wider", rarityBadge[s.rarity])}>
                      {s.rarity}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="truncate text-base font-bold">{s.name}</h3>
                  <p className={cn("mt-0.5 truncate text-xs font-medium", rarityTypeText[s.rarity])}>
                    {s.type ?? "未知类型"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
