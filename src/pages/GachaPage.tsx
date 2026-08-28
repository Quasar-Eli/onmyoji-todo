import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game, type Rarity, type Shikigami } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// 概率（可调）：SP 0.2% / SSR 1.2% / SR 14.6% / R 84%
const RATES: Record<Rarity, number> = { SP: 0.002, SSR: 0.012, SR: 0.146, R: 0.84 }

const RARITY_COLOR: Record<Rarity, string> = {
  SP: "text-fuchsia-400",
  SSR: "text-amber-400",
  SR: "text-sky-400",
  R: "text-zinc-300",
}

/** 掷出稀有度（按概率） */
const rollRarity = (): Rarity => {
  const r = Math.random()
  if (r < RATES.SP) return "SP"
  if (r < RATES.SP + RATES.SSR) return "SSR"
  if (r < RATES.SP + RATES.SSR + RATES.SR) return "SR"
  return "R"
}

/** 从对应稀有度池中随机取一个式神 */
const pickShikigami = (pool: Shikigami[], rarity: Rarity): Shikigami | null => {
  const candidates = pool.filter((s) => s.rarity === rarity)
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

interface RollResult {
  id: string
  name: string
  rarity: Rarity
  image_url: string | null
}

export function GachaPage() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<Game | null>(null)
  const [pool, setPool] = useState<Shikigami[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<RollResult[]>([])
  const [rolling, setRolling] = useState(false)

  useDocumentTitle(game ? `${game.name} · 抽卡模拟器` : "抽卡模拟器")

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const { data: g } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle()
      if (!g) {
        setLoading(false)
        return
      }
      setGame(g as Game)
      const { data: s } = await supabase.from("shikigami").select("*").eq("game_id", (g as Game).id)
      setPool((s as Shikigami[]) ?? [])
      setLoading(false)
    })()
  }, [slug])

  const stats = useMemo(() => {
    const total = results.length
    const byRarity = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.rarity] = (acc[r.rarity] ?? 0) + 1
      return acc
    }, {})
    const high = (byRarity.SP ?? 0) + (byRarity.SSR ?? 0)
    return { total, SP: byRarity.SP ?? 0, SSR: byRarity.SSR ?? 0, SR: byRarity.SR ?? 0, R: byRarity.R ?? 0, rate: total ? high / total : 0 }
  }, [results])

  const doRoll = (count: number) => {
    setRolling(true)
    // 延迟动画感
    setTimeout(() => {
      const next: RollResult[] = []
      for (let i = 0; i < count; i++) {
        const rarity = rollRarity()
        const s = pickShikigami(pool, rarity)
        if (s) next.push({ id: s.id, name: s.name, rarity, image_url: s.image_url })
      }
      setResults((prev) => [...next, ...prev].slice(0, 60))
      setRolling(false)
    }, 300)
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-1/3" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-muted-foreground">
        未找到该栏目
      </div>
    )
  }

  const highCount = stats.SP + stats.SSR

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        to={`/game/${game.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回 {game.name}
      </Link>

      <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
        <Sparkles className="h-7 w-7 text-primary" />
        {game.name} · 抽卡模拟器
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        概率（演示）：SP {RATES.SP * 100}% / SSR {RATES.SSR * 100}% / SR {RATES.SR * 100}% / R {RATES.R * 100}%
      </p>

      <Card className="mb-6 p-6 text-center">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div>
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">总抽数</p>
          </div>
          <div>
            <p className="text-xl font-bold text-fuchsia-400">{stats.SP}</p>
            <p className="text-xs text-muted-foreground">SP</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-400">{stats.SSR}</p>
            <p className="text-xs text-muted-foreground">SSR</p>
          </div>
          <div>
            <p className="text-xl font-bold text-sky-400">{stats.SR}</p>
            <p className="text-xs text-muted-foreground">SR</p>
          </div>
          <div>
            <p className="text-xl font-bold">{(stats.rate * 100).toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">欧气（SP+SSR）</p>
          </div>
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={() => doRoll(1)} disabled={rolling || pool.length === 0}>
            单抽
          </Button>
          <Button onClick={() => doRoll(10)} disabled={rolling || pool.length === 0} variant="secondary">
            十连
          </Button>
        </div>
        {pool.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">该栏目暂无式神数据，无法抽卡。</p>
        )}
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-10">
          {results.map((r, i) => (
            <Link key={`${r.id}-${i}`} to={`/game/${game.slug}/shikigami/${r.id}`}>
              <Card className="overflow-hidden transition-transform hover:scale-105">
                {r.image_url ? (
                  <img
                    src={r.image_url}
                    alt={r.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className={cn("flex aspect-square items-center justify-center text-4xl font-bold", RARITY_COLOR[r.rarity])}>
                    {r.name.slice(0, 1)}
                  </div>
                )}
                <p className={cn("truncate p-1 text-center text-[10px] font-bold", RARITY_COLOR[r.rarity])}>
                  {r.rarity} {r.name}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {highCount > 0 && (
        <p className="mt-4 text-center text-sm font-medium text-primary">
          恭喜！本轮出 {highCount} 位 SP/SSR 式神
        </p>
      )}
    </div>
  )
}
