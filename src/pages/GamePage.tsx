import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Article, type Category, type Game, type Module } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { FolderOpen, LayoutGrid, Plus, Search } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export function GamePage() {
  const { slug } = useParams<{ slug: string }>()
  const { profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [activeCat, setActiveCat] = useState<string>("all")

  const canEdit =
    profile?.role === "super_admin" ||
    profile?.role === "global_editor" ||
    (profile?.role === "game_admin" && !!game)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    ;(async () => {
      const { data: g, error: ge } = await supabase
        .from("games")
        .select("*")
        .eq("slug", slug)
        .maybeSingle()
      if (ge || !g) {
        setLoading(false)
        return
      }
      const gameData = g as Game
      setGame(gameData)

      const [{ data: cats }, { data: mods }, { data: arts }] = await Promise.all([
        supabase.from("categories").select("*").eq("game_id", gameData.id).order("sort_order"),
        supabase.from("modules").select("*").eq("game_id", gameData.id).order("sort_order"),
        supabase.from("articles").select("*").eq("game_id", gameData.id),
      ])
      setCategories((cats as Category[]) ?? [])
      setModules((mods as Module[]) ?? [])
      setArticles((arts as Article[]) ?? [])
      setLoading(false)
    })()
  }, [slug])

  // 分类 → 模块 → 内容 的展示逻辑
  const visibleModules = useMemo(() => {
    return modules.filter((m) => {
      const matchCat = activeCat === "all" || m.category_id === activeCat
      const article = articles.find((a) => a.module_id === m.id)
      const matchQuery =
        !query || m.name.toLowerCase().includes(query.toLowerCase()) || (article?.title ?? "").toLowerCase().includes(query.toLowerCase())
      return matchCat && matchQuery
    })
  }, [modules, articles, activeCat, query])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-12 w-1/2" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="grid gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{game.icon ?? "🎮"}</span>
          <div>
            <h1 className="text-3xl font-bold">{game.name}</h1>
            <p className="mt-1 text-muted-foreground">{game.description || ""}</p>
          </div>
        </div>
        {canEdit && (
          <Button asChild size="sm">
            <Link to={`/admin/game/${game.id}`}>
              <Plus className="h-4 w-4" />
              管理内容
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索模块..."
            className="flex h-10 w-full rounded-lg border border-input bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCat === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCat("all")}
          >
            全部
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={activeCat === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCat(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {visibleModules.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无内容</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleModules.map((module) => {
            const article = articles.find((a) => a.module_id === module.id)
            const cat = categories.find((c) => c.id === module.category_id)
            return (
              <Link key={module.id} to={article ? `/article/${article.id}` : "#"}>
                <Card
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent/50",
                    !article && "pointer-events-none opacity-50"
                  )}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <LayoutGrid className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{module.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        {cat?.name ?? "未分类"}
                        {article && (
                          <span>· 更新于 {new Date(article.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}