import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { supabase, type Article, type Category, type Game } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Comments } from "@/components/Comments"
import { useAuth } from "@/context/AuthContext"
import { ArrowLeft, CalendarDays, User } from "lucide-react"

interface Heading {
  id: string
  text: string
  level: number
}

export function ArticlePage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [authorName, setAuthorName] = useState<string | null>(null)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [loading, setLoading] = useState(true)

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

      // 从正文提取目录
      const heads: Heading[] = []
      const lines = art.content.split("\n")
      for (const line of lines) {
        const m = /^(#{1,3})\s+(.*)$/.exec(line)
        if (m) {
          const text = m[2].trim()
          heads.push({
            id: "h-" + heads.length,
            text,
            level: m[1].length,
          })
        }
      }
      setHeadings(heads)

      const [{ data: g }, { data: c }, { data: author }] = await Promise.all([
        supabase.from("games").select("*").eq("id", art.game_id).maybeSingle(),
        art.category_id
          ? supabase.from("categories").select("*").eq("id", art.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        art.created_by
          ? supabase.from("profiles").select("username").eq("id", art.created_by).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
      setGame((g as Game) ?? null)
      setCategory((c as Category) ?? null)
      setAuthorName((author as { username: string } | null)?.username ?? null)
      setLoading(false)
    })()
  }, [id])

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
        <Link
          to={`/game/${game?.slug ?? ""}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回 {game?.name ?? ""}
        </Link>

        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            更新于 {new Date(article.updated_at).toLocaleDateString()}
          </span>
          {category && <span>{category.name}</span>}
          {authorName && (
            <span className="inline-flex items-center gap-1">
              <User className="h-4 w-4" />
              {authorName}
            </span>
          )}
        </div>

        <Card className="mt-6 p-6">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <MarkdownWithHeadings content={article.content} />
          </div>
        </Card>

        <Comments
          articleId={article.id}
          gameId={article.game_id}
          canModerate={
            profile?.role === "super_admin" || profile?.role === "global_editor"
          }
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