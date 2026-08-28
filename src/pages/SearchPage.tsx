import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { supabase, type Game } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/lib/seo"
import { BookOpen, FileText, Search, Swords } from "lucide-react"

interface ArticleHit {
  id: string
  title: string
  game_id: string
  game_name?: string
  game_slug?: string
  updated_at: string
}
interface ShikigamiHit {
  id: string
  name: string
  rarity: string
  type?: string | null
  game_id: string
  game_name?: string
  game_slug?: string
}
interface ModuleHit {
  id: string
  name: string
  game_id: string
  game_name?: string
  game_slug?: string
}

interface SearchState {
  articles: ArticleHit[]
  shikigami: ShikigamiHit[]
  modules: ModuleHit[]
}

const emptyState: SearchState = { articles: [], shikigami: [], modules: [] }

/** 关键词高亮（仅高亮首处命中，足够预览） */
const highlight = (text: string, keyword: string) => {
  const k = keyword.trim()
  if (!k) return text
  const idx = text.toLowerCase().indexOf(k.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-700/50">{text.slice(idx, idx + k.length)}</mark>
      {text.slice(idx + k.length)}
    </>
  )
}

export function SearchPage() {
  const [params] = useSearchParams()
  const initialQ = params.get("q") ?? ""
  const tag = params.get("tag") ?? ""
  const [input, setInput] = useState(initialQ)
  const [state, setState] = useState<SearchState>(emptyState)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useDocumentTitle(
    tag ? `标签：${tag}` : initialQ ? `搜索：${initialQ}` : "搜索",
    "跨栏目搜索攻略、式神与模块"
  )

  const gameMap = useMemo(() => new Map<string, Game>(), [])

  const run = useCallback(
    async (keyword: string) => {
      const k = keyword.trim()
      if (!k) {
        setState(emptyState)
        setSearched(false)
        return
      }
      setLoading(true)
      setSearched(true)
      try {
        const [gRes, aRes, sRes, mRes] = await Promise.all([
          supabase.from("games").select("id, name, slug"),
          supabase.from("articles")
            .select("id, title, game_id, updated_at")
            .or(`title.ilike.%${k}%,content.ilike.%${k}%`)
            .limit(20),
          supabase.from("shikigami")
            .select("id, name, rarity, type, game_id")
            .ilike("name", `%${k}%`)
            .limit(20),
          supabase.from("modules")
            .select("id, name, game_id")
            .ilike("name", `%${k}%`)
            .limit(20),
        ])
        ;(gRes.data as Game[] | null)?.forEach((g) => gameMap.set(g.id, g))
        const gname = (id: string) => gameMap.get(id)?.name
        const gslug = (id: string) => gameMap.get(id)?.slug
        setState({
          articles: ((aRes.data ?? []) as { id: string; title: string; game_id: string; updated_at: string }[]).map((r) => ({
            ...r,
            game_name: gname(r.game_id),
            game_slug: gslug(r.game_id),
          })),
          shikigami: ((sRes.data ?? []) as { id: string; name: string; rarity: string; type?: string | null; game_id: string }[]).map((r) => ({
            ...r,
            game_name: gname(r.game_id),
            game_slug: gslug(r.game_id),
          })),
          modules: ((mRes.data ?? []) as { id: string; name: string; game_id: string }[]).map((r) => ({
            ...r,
            game_name: gname(r.game_id),
            game_slug: gslug(r.game_id),
          })),
        })
      } finally {
        setLoading(false)
      }
    },
    [gameMap]
  )

  // tag 模式：按标签聚合文章
  const runTag = useCallback(async (t: string) => {
    if (!t) return
    setLoading(true)
    setSearched(true)
    try {
      const [gRes, aRes] = await Promise.all([
        supabase.from("games").select("id, name, slug"),
        supabase.from("articles")
          .select("id, title, game_id, updated_at")
          .contains("tags", [t])
          .limit(50),
      ])
      ;(gRes.data as Game[] | null)?.forEach((g) => gameMap.set(g.id, g))
      setState({
        articles: ((aRes.data ?? []) as { id: string; title: string; game_id: string; updated_at: string }[]).map((r) => ({
          ...r,
          game_name: gameMap.get(r.game_id)?.name,
          game_slug: gameMap.get(r.game_id)?.slug,
        })),
        shikigami: [],
        modules: [],
      })
    } finally {
      setLoading(false)
    }
  }, [gameMap])

  useEffect(() => {
    if (tag) void runTag(tag)
    else if (initialQ) void run(initialQ)
  }, [tag, initialQ, run, runTag])

  const submit = () => {
    if (!input.trim()) return
    window.location.hash = `#/search?q=${encodeURIComponent(input.trim())}`
  }

  const total = state.articles.length + state.shikigami.length + state.modules.length

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">全站搜索</h1>

      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="搜索攻略、式神、模块..."
            className="pl-10"
          />
        </div>
        <Button onClick={submit} disabled={!input.trim()}>
          搜索
        </Button>
      </div>

      {tag && (
        <p className="mb-4 text-sm text-muted-foreground">
          标签：<span className="font-medium text-primary">{tag}</span>（共 {state.articles.length} 篇）
        </p>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && searched && total === 0 && (
        <p className="py-16 text-center text-muted-foreground">没有找到相关内容，换个关键词试试。</p>
      )}

      {!loading && searched && total > 0 && (
        <div className="flex flex-col gap-6">
          {state.articles.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-semibold">
                <BookOpen className="h-4 w-4 text-primary" />
                攻略词条（{state.articles.length}）
              </h2>
              <div className="flex flex-col gap-2">
                {state.articles.map((a) => (
                  <Link key={a.id} to={`/article/${a.id}`}>
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="p-3">
                        <p className="truncate text-sm font-medium">{highlight(a.title, tag || input)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {a.game_name ?? "未知栏目"} · {new Date(a.updated_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {state.shikigami.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-semibold">
                <Swords className="h-4 w-4 text-primary" />
                式神（{state.shikigami.length}）
              </h2>
              <div className="flex flex-wrap gap-2">
                {state.shikigami.map((s) => (
                  <Link key={s.id} to={s.game_slug ? `/game/${s.game_slug}/shikigami/${s.id}` : "#"}>
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="flex items-center gap-2 p-3">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                          {s.rarity}
                        </span>
                        <span className="text-sm font-medium">{highlight(s.name, tag || input)}</span>
                        {s.game_name && (
                          <span className="text-xs text-muted-foreground">{s.game_name}</span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {state.modules.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                模块（{state.modules.length}）
              </h2>
              <div className="flex flex-wrap gap-2">
                {state.modules.map((m) => (
                  <Link key={m.id} to={m.game_slug ? `/game/${m.game_slug}` : "#"}>
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{highlight(m.name, tag || input)}</p>
                        <p className="text-xs text-muted-foreground">{m.game_name}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
