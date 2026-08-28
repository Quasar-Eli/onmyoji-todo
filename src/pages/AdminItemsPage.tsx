import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game, type Item } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react"

interface ItemForm {
  name: string
  type: string
  rarity: string
  image_url: string
  description: string
  detail: string
  source: string
}

const emptyForm: ItemForm = {
  name: "",
  type: "",
  rarity: "",
  image_url: "",
  description: "",
  detail: "",
  source: "",
}

export function AdminItemsPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [list, setList] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState<ItemForm>(emptyForm)

  useDocumentTitle(game ? `${game.name} · 装备管理` : "装备管理")

  const canManage =
    profile?.role === "super_admin" ||
    profile?.role === "global_editor" ||
    (profile?.role === "game_admin" && !!game)

  const load = async () => {
    if (!gameId) return
    const [{ data: g }, { data: s }] = await Promise.all([
      supabase.from("games").select("*").eq("id", gameId).maybeSingle(),
      supabase.from("items").select("*").eq("game_id", gameId).order("sort_order"),
    ])
    setGame((g as Game) ?? null)
    setList((s as Item[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (item: Item) => {
    setEditing(item)
    setForm({
      name: item.name,
      type: item.type ?? "",
      rarity: item.rarity ?? "",
      image_url: item.image_url ?? "",
      description: item.description ?? "",
      detail: item.detail ?? "",
      source: item.source ?? "",
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim() || !gameId) return
    const payload = {
      name: form.name.trim(),
      type: form.type.trim() || null,
      rarity: form.rarity.trim() || null,
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
      detail: form.detail.trim() || null,
      source: form.source.trim() || null,
    }
    if (editing) {
      await supabase.from("items").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("items").insert({ ...payload, game_id: gameId, created_by: profile?.id ?? null })
    }
    setOpen(false)
    void load()
  }

  const remove = async (id: string) => {
    await supabase.from("items").delete().eq("id", id)
    void load()
  }

  if (loading) return <p className="py-16 text-center text-muted-foreground">加载中...</p>
  if (!game) return <p className="py-16 text-center text-muted-foreground">栏目不存在</p>
  if (!canManage) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        你没有该栏目的编辑权限。
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        返回后台
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{game.name} · 装备管理</h1>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          添加装备
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">暂无装备，点击右上角添加。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🛡️</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.rarity && <Badge variant="outline" className="text-xs">{item.rarity}</Badge>}
                      {item.type && <span className="text-xs text-muted-foreground">{item.type}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                    编辑
                  </Button>
                  <ConfirmDialog
                    title={`删除"${item.name}"？`}
                    description="删除后不可恢复。"
                    onConfirm={() => remove(item.id)}
                  >
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editing ? "编辑装备" : "添加装备"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label>名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>类型</Label>
                <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="如：御魂/武器" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>稀有度</Label>
                <Input value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} placeholder="如：SSR" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>图片 URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>简介</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>详细介绍（Markdown）</Label>
              <Textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} rows={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>获取途径</Label>
              <Textarea value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} rows={3} />
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
