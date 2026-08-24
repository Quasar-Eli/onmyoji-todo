import { useEffect, useState } from "react"
import { supabase, type Comment } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { MessageSquare, Send, Trash2, Reply } from "lucide-react"

interface CommentWithUser extends Comment {
  username?: string
  avatar_url?: string | null
  replies: CommentWithUser[]
}

interface CommentsProps {
  articleId: string
  gameId: string
  canModerate: boolean
}

export function Comments({ articleId, canModerate }: CommentsProps) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState("")
  const [replyTarget, setReplyTarget] = useState<CommentWithUser | null>(null)
  const [replyContent, setReplyContent] = useState("")

  const load = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", articleId)
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

  useEffect(() => {
    load()
  }, [articleId])

  const submit = async () => {
    if (!user || !newContent.trim()) return
    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      content: newContent.trim(),
    })
    if (!error) {
      setNewContent("")
      load()
    }
  }

  const submitReply = async () => {
    if (!user || !replyTarget || !replyContent.trim()) return
    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      parent_id: replyTarget.id,
      user_id: user.id,
      content: replyContent.trim(),
    })
    if (!error) {
      setReplyContent("")
      setReplyTarget(null)
      load()
    }
  }

  const remove = async (comment: CommentWithUser) => {
    await supabase.from("comments").delete().eq("id", comment.id)
    load()
  }

  const renderComment = (comment: CommentWithUser, isReply = false) => (
    <div key={comment.id} className={isReply ? "ml-8 mt-3" : ""}>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              {comment.avatar_url ? (
                <img src={comment.avatar_url} alt="" className="h-full w-full object-cover" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={() => setReplyTarget(comment)}
                  >
                    <Reply className="h-3 w-3" />
                    回复
                  </Button>
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
      </h2>

      {user ? (
        <Card className="mb-4">
          <CardContent className="flex gap-2 p-3">
            <Input
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="写下你的评论..."
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <Button onClick={submit} disabled={!newContent.trim()}>
              <Send className="h-4 w-4" />
              发送
            </Button>
          </CardContent>
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

      {loading ? (
        <p className="text-sm text-muted-foreground">加载评论...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">还没有评论，来抢沙发吧。</p>
      ) : (
        <div className="flex flex-col gap-3">{comments.map((c) => renderComment(c))}</div>
      )}
    </div>
  )
}