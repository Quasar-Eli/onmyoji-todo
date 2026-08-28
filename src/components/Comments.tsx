import { useEffect, useState } from "react"
import { supabase, type Comment } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { validateComment } from "@/lib/sensitive"
import { cn } from "@/lib/utils"
import { MessageSquare, Send, ThumbsUp, Trash2, Reply } from "lucide-react"

export type CommentTargetType = "article" | "shikigami" | "item"

interface CommentWithUser extends Comment {
  username?: string
  avatar_url?: string | null
  replies: CommentWithUser[]
}

interface CommentsProps {
  targetType: CommentTargetType
  targetId: string
  canModerate: boolean
}

type SortMode = "new" | "hot"

const PAGE_SIZE = 20

/** 通用实体评论：article / shikigami / item 多态复用 */
export function Comments({ targetType, targetId, canModerate }: CommentsProps) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState("")
  const [replyTarget, setReplyTarget] = useState<CommentWithUser | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>("new")
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})

  const load = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: true })
    if (error || !data) {
      setLoading(false)
      return
    }
    const raw = data as Comment[]

    // 获取用户信息
    const userIds = [...new Set(raw.map((c) => c.user_id))]
    let userMap: Record<string, { username?: string; avatar_url?: string | null }> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds)
      if (profiles) {
        userMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
      }
    }

    // 组织成树形（父评论 + replies）
    const withUser = raw.map((c) => ({
      ...c,
      username: userMap[c.user_id]?.username,
      avatar_url: userMap[c.user_id]?.avatar_url,
      replies: [] as CommentWithUser[],
    }))

    const roots: CommentWithUser[] = []
    const byId = new Map<string, CommentWithUser>()
    withUser.forEach((c) => byId.set(c.id, c))
    withUser.forEach((c) => {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies.push(c)
      } else {
        roots.push(c)
      }
    })

    setComments(roots)
    setLoading(false)
  }

  // 加载当前用户的评论点赞状态（RLS：仅本人可读）
  const loadLikedState = async (commentIds: string[]) => {
    if (!user || commentIds.length === 0) return
    const { data } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", commentIds)
    if (data) {
      setLikedMap(Object.fromEntries(data.map((l) => [l.comment_id, true])))
    }
  }

  useEffect(() => {
    setLoading(true)
    setVisible(PAGE_SIZE)
    setReplyTarget(null)
    ;(async () => {
      await load()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId])

  // 加载完评论后再拉点赞状态
  useEffect(() => {
    const ids = flattenComments(comments).map((c) => c.id)
    void loadLikedState(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, user])

  const submit = async () => {
    if (!user) return
    const err = validateComment(newContent)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    const { error } = await supabase.from("comments").insert({
      target_type: targetType,
      target_id: targetId,
      user_id: user.id,
      content: newContent.trim(),
    })
    if (!error) {
      setNewContent("")
      await load()
    }
  }

  const submitReply = async () => {
    if (!user || !replyTarget) return
    const err = validateComment(replyContent)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    const { error } = await supabase.from("comments").insert({
      target_type: targetType,
      target_id: targetId,
      parent_id: replyTarget.id,
      user_id: user.id,
      content: replyContent.trim(),
    })
    if (!error) {
      setReplyContent("")
      setReplyTarget(null)
      await load()
    }
  }

  const remove = async (comment: CommentWithUser) => {
    await supabase.from("comments").delete().eq("id", comment.id)
    await load()
  }

  /** C1：评论点赞切换 */
  const toggleLike = async (comment: CommentWithUser) => {
    if (!user) return
    const { data, error } = await supabase.rpc("toggle_comment_like", {
      p_comment_id: comment.id,
    })
    if (error || !data) return
    const res = data as { liked: boolean; count: number }
    setLikedMap((m) => ({ ...m, [comment.id]: res.liked }))
    // 本地同步点赞数
    setComments((list) =>
      list.map((c) =>
        updateComment(c, comment.id, (target) => ({ ...target, like_count: res.count }))
      )
    )
  }

  const sortedRoots = [...comments].sort((a, b) =>
    sort === "hot"
      ? (b.like_count ?? 0) - (a.like_count ?? 0)
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const visibleRoots = sortedRoots.slice(0, visible)

  const renderComment = (comment: CommentWithUser, isReply = false) => (
    <div key={comment.id} className={isReply ? "ml-8 mt-3" : ""}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              {comment.avatar_url ? (
                <img src={comment.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <AvatarFallback>{comment.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{comment.username ?? "用户"}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 break-words text-sm">{comment.content}</p>
              <div className="mt-2 flex items-center gap-2">
                {user && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => void toggleLike(comment)}
                      disabled={!user}
                      title={user ? undefined : "登录后可点赞"}
                    >
                      <ThumbsUp
                        className={cn(
                          "h-3 w-3",
                          likedMap[comment.id] && "fill-current text-primary"
                        )}
                      />
                      {comment.like_count ?? 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => setReplyTarget(comment)}
                    >
                      <Reply className="h-3 w-3" />
                      回复
                    </Button>
                  </>
                )}
                {(profile?.id === comment.user_id || canModerate) && (
                  <ConfirmDialog
                    title="删除该评论？"
                    description="删除后不可恢复。"
                    onConfirm={() => remove(comment)}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-2 text-xs text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      删除
                    </Button>
                  </ConfirmDialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {comment.replies.map((r) => renderComment(r, true))}
    </div>
  )

  return (
    <div className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5 text-primary" />
        评论
        <span className="text-sm font-normal text-muted-foreground">
          {comments.length}
        </span>
      </h2>

      {user ? (
        <Card className="mb-4">
          <CardContent className="flex gap-2 p-3">
            <Input
              value={newContent}
              onChange={(e) => {
                setNewContent(e.target.value)
                if (error) setError(null)
              }}
              placeholder="写下你的评论..."
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <Button onClick={submit} disabled={!newContent.trim()}>
              <Send className="h-4 w-4" />
              发送
            </Button>
          </CardContent>
          {error && <p className="px-3 pb-3 text-sm text-destructive">{error}</p>}
        </Card>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">登录后即可发表评论。</p>
      )}

      {replyTarget && (
        <Card className="mb-4 border-primary/40">
          <CardContent className="flex gap-2 p-3">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`回复 ${replyTarget.username ?? "用户"}:`}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
            />
            <Button onClick={submitReply} disabled={!replyContent.trim()}>
              回复
            </Button>
            <Button variant="ghost" onClick={() => setReplyTarget(null)}>
              取消
            </Button>
          </CardContent>
        </Card>
      )}

      {comments.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <Button
            variant={sort === "new" ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSort("new")}
          >
            最新
          </Button>
          <Button
            variant={sort === "hot" ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSort("hot")}
          >
            最热
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">加载评论...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">还没有评论，来抢沙发吧。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleRoots.map((c) => renderComment(c))}
          {visible < sortedRoots.length && (
            <Button variant="outline" className="w-full" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              加载更多（剩余 {sortedRoots.length - visible} 条）
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** 扁平化评论树 */
const flattenComments = (list: CommentWithUser[]): CommentWithUser[] =>
  list.flatMap((c) => [c, ...flattenComments(c.replies)])

/** 递归更新某条评论（含子树） */
const updateComment = (
  node: CommentWithUser,
  id: string,
  fn: (c: CommentWithUser) => CommentWithUser
): CommentWithUser => {
  if (node.id === id) return fn(node)
  if (node.replies.length === 0) return node
  return { ...node, replies: node.replies.map((r) => updateComment(r, id, fn)) }
}
