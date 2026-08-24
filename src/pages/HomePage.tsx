import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase, type Game } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Gamepad2, Search } from "lucide-react"

export function HomePage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    supabase
      .from("games")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setGames(data as Game[])
        setLoading(false)
      })
  }, [])

  const filtered = games.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-5xl">
          <Gamepad2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-wide">多游戏 Wiki 中心</h1>
        <p className="mt-2 text-muted-foreground">
          浏览各游戏的攻略、图鉴与词条，一站式查阅
        </p>
      </div>

      <div className="relative mb-8 mx-auto w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索游戏..."
          className="flex h-10 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          还没有游戏，等待超管添加。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((game) => (
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