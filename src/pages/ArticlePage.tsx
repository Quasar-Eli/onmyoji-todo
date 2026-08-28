import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { supabase, type Article, type Category, type Game } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Comments } from "@/components/Comments"
import { useAuth } from "@/context/AuthContext"
import { useDocumentTitle } from "@/lib/seo"
import {
  Bookmark,
  CalendarDays,
  Eye,
  Link2,
  Tag,
  ThumbsUp,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Heading {
  id: string
  text: string
  level: number
}

interface RelatedArticle {
  id: string
  title: string
  updated_at: string
}

/** 复制链接到剪贴板 */
const copyLink = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

export function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [authorName, setAuthorName] = useState<string | null>(null)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [related, setRelated] = useState<RelatedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [fav, setFav] = useState(false)
  const [copied, setCopied] = useState(false)

  useDocumentTitle(article?.title, game ? `${article?.title ?? ""} - ${game.name} 攻略` : undefined)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (error || !data) {
        setLoading(false)
        return
      }
      const art = data as Article
      setArticle(art)
      setLikeCount(art.like_count ?? 0)

      // B1：进入详情浏览量 +1（幂等函数，security definer）
      void supabase.rpc("increment_article_views", { p_article_id: id })

      // 提取目录
      const heads: Heading[] = []
      const lines = art.content.split("\n")
      for (const line of lines) {
        const m = /^(#{1,3})\s+(.*)$/.exec(line)
        if (m) {
          heads.push({
            id: "h-" + heads.length,
            text: m[2].trim(),
            level: m[1].length,
          })
        }
      }
      setHeadings(heads)

      const [{ data: g }, { data: c }, { data: author }, { data: rel }] = await Promise.all([
        supabase.from("games").select("*").eq("id", art.game_id).maybeSingle(),
        art.category_id
          ? supabase.from("categories").select("*").eq("id", art.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        art.created_by
          ? supabase.from("profiles").select("username").eq("id", art.created_by).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("articles")
          .select("id, title, updated_at")
          .eq("game_id", art.game_id)
          .neq("id", art.id)
          .order("updated_at", { ascending: false })
          .limit(5),
      ])
      setGame((g as Game) ?? null)
      setCategory((c as Category) ?? null)
      setAuthorName((author as { username: string } | null)?.username ?? null)
      setRelated((rel as RelatedArticle[] | null) ?? [])

      // 当前用户状态：是否已赞 / 是否已收藏（RLS：本人可读）
      if (user) {
        const [{ data: like }, { data: favData }] = await Promise.all([
          supabase
            .from("article_likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("article_id", id)
            .maybeSingle(),
          supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("target_type", "article")
            .eq("target_id", id)
            .maybeSingle(),
        ])
        setLiked(!!like)
        setFav(!!favData)
      }
      setLoading(false)
    })()
  }, [id, user])

  const toggleLike = async () => {
    if (!user || !article) return
    const { data, error } = await supabase.rpc("toggle_article_like", {
      p_article_id: article.id,
    })
    if (error || !data) return
    const res = data as { liked: boolean; count: number }
    setLiked(res.liked)
    setLikeCount(res.count)
  }

  /** C2：收藏 / 取消收藏 */
  const toggleFavorite = async () => {
    if (!user || !article) return
    if (fav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("target_type", "article")
        .eq("target_id", article.id)
      setFav(false)
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        target_type: "article",
        target_id: article.id,
      })
      setFav(true)
    }
  }

  const share = async () => {
    const ok = await copyLink(window.location.href)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        词条不存在
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-6 px-4 py-8">
      <div className="min-w-0 flex-1">
        {/* A3：面包屑 */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">首页</Link>
          <span>/</span>
          <Link to={`/game/${game?.slug ?? ""}`} className="hover:text-primary">
            {game?.name ?? "栏目"}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground">{article.title}</span>
        </nav>

        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            更新于 {new Date(article.updated_at).toLocaleDateString()}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {(article.view_count ?? 0).toLocaleString()} 次浏览
          </span>
          {article.version && <span>版本 v{article.version}</span>}
          {category && <span>{category.name}</span>}
          {authorName && (
            <span className="inline-flex items-center gap-1">
              <User className="h-4 w-4" />
              {authorName}
            </span>
          )}
        </div>

        {/* B1/C2：点赞 / 收藏 / 分享 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={liked ? "default" : "outline"}
            onClick={() => void toggleLike()}
            disabled={!user}
            title={user ? undefined : "登录后可点赞"}
          >
            <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
            {likeCount}
          </Button>
          <Button
            size="sm"
            variant={fav ? "default" : "outline"}
            onClick={() => void toggleFavorite()}
            disabled={!user}
            title={user ? undefined : "登录后可收藏"}
          >
            <Bookmark className={cn("h-4 w-4", fav && "fill-current")} />
            {fav ? "已收藏" : "收藏"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => void share()}>
            <Link2 className="h-4 w-4" />
            {copied ? "已复制链接" : "分享"}
          </Button>
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {article.tags.map((t) => (
                <Link
                  key={t}
                  to={`/search?tag=${encodeURIComponent(t)}`}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground transition-colors hover:bg-accent"
                >
                  <Tag className="h-3 w-3" />
                  {t}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Card className="mt-6 p-6">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <MarkdownWithHeadings content={article.content} />
          </div>
        </Card>

        {/* B5：相关推荐 */}
        {related.length > 0 && (
          <Card className="mt-6 p-5">
            <h2 className="mb-3 font-semibold">相关推荐</h2>
            <ul className="flex flex-col divide-y">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/article/${r.id}`}
                    className="flex items-center justify-between gap-3 py-2 transition-colors hover:text-primary"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(r.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Comments
          articleId={article.id}
          gameId={article.game_id}
          canModerate={profile?.role === "super_admin" || profile?.role === "global_editor"}
        />
      </div>

      {headings.length > 0 && (
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-52 shrink-0 overflow-y-auto lg:block">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            目录
          </p>
          <ul className="space-y-1 text-sm">
            {headings.map((h) => (
              <li key={h.id} style={{ paddingLeft: (h.level - 1) * 12 }}>
                <a
                  href={`#${h.id}`}
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    const el = document.getElementById(h.id)
                    el?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}

/** 渲染 Markdown，并给标题加锚点 id（供目录定位） */
function MarkdownWithHeadings({ content }: { content: string }) {
  let counter = 0

  const components: Components = {
    h1: ({ children }) => {
      const id = "h-" + counter++
      return <h1 id={id}>{children}</h1>
    },
    h2: ({ children }) => {
      const id = "h-" + counter++
      return <h2 id={id}>{children}</h2>
    },
    h3: ({ children }) => {
      const id = "h-" + counter++
      return <h3 id={id}>{children}</h3>
    },
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
