import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useIsSuperAdmin } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useDocumentTitle } from "@/lib/seo"
import { Megaphone, Pin, PinOff, Plus, Trash2 } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  pinned: boolean
  published_at: string
}

/** G2：站点公告管理（仅超管） */
export function AdminAnnouncementsPage() {
  const isSuper = useIsSuperAdmin()

  useDocumentTitle("公告管理")

  const [list, setList] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [pinned, setPinned] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
    if (error) setList([])
    else setList((data as Announcement[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (isSuper) void load()
  }, [isSuper])

  const publish = async () => {
    if (!title.trim()) return
    const { error } = await supabase
      .from("announcements")
      .insert({ title: title.trim(), content: content.trim(), pinned })
    if (error) {
      setMsg("发布失败：" + error.message)
      return
    }
    setTitle("")
    setContent("")
    setPinned(false)
    setMsg("已发布")
    void load()
  }

  const remove = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id)
    void load()
  }

  const togglePin = async (a: Announcement) => {
    await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id)
    void load()
  }

  if (!isSuper) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        仅超管可管理公告。
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Megaphone className="h-6 w-6 text-primary" />
        公告管理
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>发布公告</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="公告标题" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="公告内容（支持换行）"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            置顶显示
          </label>
          <Button onClick={publish} disabled={!title.trim()}>
            <Plus className="h-4 w-4" />
            发布
          </Button>
          {msg && <p className="text-sm text-primary">{msg}</p>}
        </CardContent>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">加载中...</p>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">暂无公告</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{a.title}</span>
                      {a.pinned && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">置顶</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.published_at).toLocaleString()}
                      </span>
                    </div>
                    {a.content && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{a.content}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => togglePin(a)} title={a.pinned ? "取消置顶" : "置顶"}>
                      {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <ConfirmDialog
                      title={`删除公告"${a.title}"？`}
                      description="删除后不可恢复。"
                      onConfirm={() => remove(a.id)}
                    >
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
