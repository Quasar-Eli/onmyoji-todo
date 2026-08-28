import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game, type Rarity, type Shikigami } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"
import { useDocumentTitle } from "@/lib/seo"

const RARITIES: Rarity[] = ["SP", "SSR", "SR", "R"]

const rarityBadge: Record<Rarity, string> = {
  SP: "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md shadow-purple-500/50 ring-1 ring-purple-200/40",
  SSR: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/50 ring-1 ring-amber-200/40",
  SR: "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md shadow-blue-500/50 ring-1 ring-sky-200/40",
  R: "bg-gradient-to-r from-zinc-500 to-slate-600 text-white shadow-md shadow-zinc-500/40 ring-1 ring-zinc-300/40",
}

const emptyForm = {
  name: "",
  rarity: "SSR" as Rarity,
  type: "",
  image_url: "",
  description: "",
  attribute: "",
  cv: "",
  version: "",
  biography: "",
  cultivate: "",
  yuhun: "",
  panel: "",
  pve: "",
  pvp: "",
}

export function AdminShikigamiPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)

  useDocumentTitle(game ? `${game.name} · 式神管理` : "式神管理")
  const [list, setList] = useState<Shikigami[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Shikigami | null>(null)
  const [form, setForm] = useState(emptyForm)

  const canManage =
    profile?.role === "super_admin" ||
    profile?.role === "global_editor" ||
    (profile?.role === "game_admin" && !!game)

  const load = async () => {
    if (!gameId) return
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from("games").select("*").eq("id", gameId).maybeSingle(),
      supabase.from("shikigami").select("*").eq("game_id", gameId).order("sort_order"),
    ])
    setGame((g as Game) ?? null)
    setList((s as Shikigami[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const set = (k: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (s: Shikigami) => {
    setEditing(s)
    setForm({
      name: s.name,
      rarity: s.rarity,
      type: s.type ?? "",
      image_url: s.image_url ?? "",
      description: s.description ?? "",
      attribute: s.attribute ?? "",
      cv: s.cv ?? "",
      version: s.version ?? "",
      biography: s.biography ?? "",
      cultivate: s.cultivate ?? "",
      yuhun: s.yuhun ?? "",
      panel: s.panel ?? "",
      pve: s.pve ?? "",
      pvp: s.pvp ?? "",
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    const payload = {
      game_id: gameId,
      name: form.name.trim(),
      rarity: form.rarity,
      type: form.type.trim() || null,
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
      attribute: form.attribute.trim() || null,
      cv: form.cv.trim() || null,
      version: form.version.trim() || null,
      biography: form.biography.trim() || null,
      cultivate: form.cultivate.trim() || null,
      yuhun: form.yuhun.trim() || null,
      panel: form.panel.trim() || null,
      pve: form.pve.trim() || null,
      pvp: form.pvp.trim() || null,
    }
    if (editing) {
      await supabase.from("shikigami").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("shikigami").insert({ ...payload, created_by: profile?.id ?? null })
    }
    setOpen(false)
    void load()
  }

  const remove = async (id: string) => {
    await supabase.from("shikigami").delete().eq("id", id)
    void load()
  }

  if (loading) return <p className="py-16 text-center text-muted-foreground">加载中...</p>
  if (!game) return <p className="py-16 text-center text-muted-foreground">栏目不存在</p>
  if (!canManage) return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
      你没有该栏目的编辑权限。
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link
        to="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回后台
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{game.name} · 式神图鉴管理</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          新增式神
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          还没有式神，点击右上角新增。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {list.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.image_url ? "" : "🎴"}</span>
                    <span className="truncate font-medium">{s.name}</span>
                  </div>
                  <Badge className={cn("px-2 py-0.5 text-xs font-bold tracking-wider", rarityBadge[s.rarity])}>{s.rarity}</Badge>
                </div>
                {s.image_url && (
                  <img src={s.image_url} alt={s.name} className="mb-2 h-20 w-full rounded object-cover" referrerPolicy="no-referrer" loading="lazy" />
                )}
                <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">{s.type ?? "未知类型"}</p>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 px-2 text-xs" onClick={() => openEdit(s)}>
                    <Pencil className="h-3 w-3" />
                    编辑
                  </Button>
                  <ConfirmDialog
                    title={`删除式神"${s.name}"？`}
                    description="删除后不可恢复。"
                    onConfirm={() => remove(s.id)}
                  >
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑式神" : "新增式神"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>名称 *</Label>
                <Input value={form.name} onChange={set("name")} placeholder="如：玉藻前" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>稀有度</Label>
                <Select value={form.rarity} onValueChange={(v) => setForm((f) => ({ ...f, rarity: v as Rarity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RARITIES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>类型</Label>
                <Input value={form.type} onChange={set("type")} placeholder="如：输出 / 辅助 / 控制" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>封面图 URL</Label>
                <Input value={form.image_url} onChange={set("image_url")} placeholder="https://..." />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>简介</Label>
              <Textarea value={form.description} onChange={set("description")} rows={2} placeholder="一句话介绍" />
            </div>
            {/* B3：扩展字段 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>属性</Label>
                <Input value={form.attribute} onChange={set("attribute")} placeholder="如：火" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>声优</Label>
                <Input value={form.cv} onChange={set("cv")} placeholder="声优名" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>适用版本</Label>
                <Input value={form.version} onChange={set("version")} placeholder="如：2026.08" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>传记</Label>
              <Textarea value={form.biography} onChange={set("biography")} rows={2} placeholder="背景故事简介" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>培养方式</Label>
              <Textarea value={form.cultivate} onChange={set("cultivate")} rows={3} placeholder="黑蛋喂养、技能升级、觉醒优先级等（支持 Markdown）" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>御魂推荐</Label>
              <Textarea value={form.yuhun} onChange={set("yuhun")} rows={3} placeholder="御魂套装、属性、二件套等（支持 Markdown）" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>毕业面板</Label>
              <Textarea value={form.panel} onChange={set("panel")} rows={3} placeholder="速度/暴击/爆伤等达标数值（支持 Markdown）" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>PVE 就业</Label>
              <Textarea value={form.pve} onChange={set("pve")} rows={3} placeholder="副本/活动中的就业场景（支持 Markdown）" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>PVP 就业</Label>
              <Textarea value={form.pvp} onChange={set("pvp")} rows={3} placeholder="斗技/道馆中的就业场景（支持 Markdown）" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!form.name.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
