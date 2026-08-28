import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game, type Item } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function ItemsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [list, setList] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeType, setActiveType] = useState<string>("all")

  useDocumentTitle(game ? `${game.name} · 装备图鉴` : "装备图鉴")

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
        .from("items")
        .select("*")
        .eq("game_id", (g as Game).id)
        .order("sort_order")
      setList((s as Item[]) ?? [])
      setLoading(false)
    })()
  }, [slug])

  const types = useMemo(() => {
    const set = new Set<string>()
    list.forEach((i) => i.type && set.add(i.type))
    return [...set].sort()
  }, [list])

  const filtered = useMemo(() => {
    return list.filter((i) => {
      const matchType = activeType === "all" || i.type === activeType
      const matchQuery = i.name.toLowerCase().includes(query.toLowerCase())
      return matchType && matchQuery
    })
  }, [list, activeType, query])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-1/3" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
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
      <Link
        to={`/game/${game.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回 {game.name}
      </Link>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🛡️</span>
          <div>
            <h1 className="text-3xl font-bold">{game.name} · 装备图鉴</h1>
            <p className="mt-1 text-muted-foreground">共 {list.length} 件装备/道具，点击查看详情</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索装备..."
            className="flex h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveType("all")}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              activeType === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            )}
          >
            全部
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                activeType === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无装备</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((item) => (
            <Link key={item.id} to={`/game/${game.slug}/items/${item.id}`}>
              <Card className="group cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden bg-linear-to-br from-muted to-background">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl">
                      🛡️
                    </div>
                  )}
                  {item.rarity && (
                    <Badge className="absolute left-2 top-2 bg-black/50 text-white">
                      {item.rarity}
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="truncate font-bold">{item.name}</h3>
                  {item.type && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.type}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
