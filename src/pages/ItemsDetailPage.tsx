import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { supabase, type Game, type Item } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useDocumentTitle } from "@/lib/seo"
import { Comments } from "@/components/Comments"
import { useAuth } from "@/context/AuthContext"
import { ArrowLeft, MapPin } from "lucide-react"

export function ItemsDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const { profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useDocumentTitle(item?.name, item ? `${item.name} - ${game?.name ?? ""} 装备图鉴` : undefined)

  useEffect(() => {
    if (!id || !slug) return
    setLoading(true)
    ;(async () => {
      const [{ data: g }, { data: s }] = await Promise.all([
        supabase.from("games").select("*").eq("slug", slug).maybeSingle(),
        supabase.from("items").select("*").eq("id", id).maybeSingle(),
      ])
      setGame((g as Game) ?? null)
      setItem((s as Item) ?? null)
      setLoading(false)
    })()
  }, [id, slug])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (!item || !game) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-muted-foreground">
        装备不存在
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        to={`/game/${game.slug}/items`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回装备图鉴
      </Link>

      <Card className="mb-6 overflow-hidden">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
          <div className="h-52 w-44 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-muted to-background ring-1 ring-black/5">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => (e.currentTarget.style.display = "none")}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl">🛡️</div>
            )}
          </div>
          <div className="flex flex-col justify-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold">{item.name}</h1>
              {item.rarity && <Badge>{item.rarity}</Badge>}
              {item.type && <Badge variant="outline">{item.type}</Badge>}
            </div>
            {item.description && (
              <p className="text-base text-muted-foreground">{item.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {item.detail && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">详细介绍</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.detail}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {item.source && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              获取途径
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.source}</p>
          </CardContent>
        </Card>
      )}

      {/* 实体化评论 */}
      <Comments
        targetType="item"
        targetId={item.id}
        canModerate={profile?.role === "super_admin" || profile?.role === "global_editor"}
      />
    </div>
  )
}
