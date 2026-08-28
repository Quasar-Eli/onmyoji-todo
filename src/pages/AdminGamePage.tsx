import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Article, type Category, type Game, type Module } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useDocumentTitle } from "@/lib/seo"
import { ConfirmDialog, PromptDialog } from "@/components/ui/confirm-dialog"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import {
  ArrowLeft,
  FileText,
  FolderOpen,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

export function AdminGamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<Module | null>(null)

  // 编辑表单
  const [editing, setEditing] = useState<Article | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [moduleId, setModuleId] = useState<string>("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [version, setVersion] = useState("")
  const [status, setStatus] = useState<"draft" | "pending" | "published">("published")

  useDocumentTitle(game ? `${game.name} · 内容管理` : "内容管理")

  const canManage =
    profile?.role === "super_admin" ||
    profile?.role === "global_editor" ||
    (profile?.role === "game_admin" && !!game)

  const load = async () => {
    if (!gameId) return
    const [{ data: g }, { data: c }, { data: m }, { data: a }] = await Promise.all([
      supabase.from("games").select("*").eq("id", gameId).maybeSingle(),
      supabase.from("categories").select("*").eq("game_id", gameId).order("sort_order"),
      supabase.from("modules").select("*").eq("game_id", gameId).order("sort_order"),
      supabase.from("articles").select("*").eq("game_id", gameId),
    ])
    setGame((g as Game) ?? null)
    setCategories((c as Category[]) ?? [])
    setModules((m as Module[]) ?? [])
    setArticles((a as Article[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [gameId])

  const addCategory = async (name: string) => {
    if (!name?.trim()) return
    await supabase.from("categories").insert({ game_id: gameId, name: name.trim() })
    load()
  }

  const removeCategory = async (cat: Category) => {
    await supabase.from("categories").delete().eq("id", cat.id)
    if (activeCat === cat.id) setActiveCat(null)
    load()
  }

  const addModule = async (cat: Category, name: string) => {
    if (!name?.trim()) return
    await supabase.from("modules").insert({
      game_id: gameId,
      category_id: cat.id,
      name: name.trim(),
    })
    setActiveCat(cat.id)
    load()
  }

  const removeModule = async (module: Module) => {
    await supabase.from("modules").delete().eq("id", module.id)
    if (activeModule?.id === module.id) setActiveModule(null)
    load()
  }

  const openNew = (module: Module) => {
    setEditing(null)
    setTitle(module.name)
    setModuleId(module.id)
    setContent("")
    setTags("")
    setVersion("")
    setStatus("published")
    setActiveModule(module)
    setActiveCat(module.category_id)
    setEditOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditing(article)
    setTitle(article.title)
    setModuleId(article.module_id ?? "")
    setContent(article.content)
    setTags((article.tags ?? []).join(", "))
    setVersion(article.version ?? "")
    setStatus((article.status as "draft" | "pending" | "published") ?? "published")
    setActiveModule(modules.find((m) => m.id === article.module_id) ?? null)
    setEditOpen(true)
  }

  const save = async () => {
    if (!title.trim() || !moduleId) return
    const module = modules.find((m) => m.id === moduleId)
    // B2：逗号分隔转数组
    const tagList = tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    const payload = {
      title,
      category_id: module?.category_id ?? null,
      module_id: moduleId,
      content,
      tags: tagList,
      version: version.trim() || null,
      status,
    }
    if (editing) {
      await supabase
        .from("articles")
        .update(payload)
        .eq("id", editing.id)
    } else {
      await supabase.from("articles").insert({
        ...payload,
        game_id: gameId,
        created_by: profile?.id ?? null,
      })
    }
    setEditOpen(false)
    load()
  }

  const catModules = (catId: string) => modules.filter((m) => m.category_id === catId)
  const moduleArticle = (moduleId: string) => articles.find((a) => a.module_id === moduleId)

  if (loading) return <p className="py-16 text-center text-muted-foreground">加载中...</p>
  if (!game) return <p className="py-16 text-center text-muted-foreground">栏目不存在</p>
  if (!canManage) return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
      你没有该栏目的编辑权限。
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Link
        to="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回后台
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{game.name} · 内容管理</h1>
        <PromptDialog
          title="添加分类"
          label="分类名称"
          placeholder="输入分类名称"
          onConfirm={addCategory}
        >
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            添加分类
          </Button>
        </PromptDialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* 左侧：分类列表 */}
        <div className="flex flex-col gap-2">
          <Button
            variant={activeCat === null ? "default" : "outline"}
            className="justify-start"
            onClick={() => setActiveCat(null)}
          >
            <FolderOpen className="h-4 w-4" />
            全部
          </Button>
          {categories.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                activeCat === c.id ? "border-primary bg-primary/5" : "hover:bg-accent"
              )}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => setActiveCat(c.id)}
              >
                <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{c.name}</span>
              </button>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <PromptDialog
                  title={`在"${c.name}"下新建模块`}
                  label="模块名称"
                  placeholder="输入模块名称"
                  onConfirm={(v) => addModule(c, v)}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </PromptDialog>
                <ConfirmDialog
                  title={`删除分类"${c.name}"？`}
                  description="会连带删除其下所有模块与内容，且不可恢复。"
                  onConfirm={() => removeCategory(c)}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </ConfirmDialog>
              </div>
            </div>
          ))}
        </div>

        {/* 右侧：模块列表 */}
        <div>
          {activeCat === null ? (
            categories.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                还没有分类，先添加一个分类。
              </p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="mb-5">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    {cat.name}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {catModules(cat.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无模块</p>
                    ) : (
                      catModules(cat.id).map((m) => {
                        const article = moduleArticle(m.id)
                        return (
                          <Card key={m.id}>
                            <CardContent className="flex items-center justify-between gap-3 p-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <LayoutGrid className="h-4 w-4 shrink-0 text-primary" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{m.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {article ? (
                                      <span className="flex items-center gap-1.5">
                                        {article.status === "pending" && (
                                          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                                            待审核
                                          </span>
                                        )}
                                        已有内容
                                      </span>
                                    ) : (
                                      "暂无内容"
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1.5">
                                <Button
                                  size="sm"
                                  variant={article ? "outline" : "default"}
                                  className="h-7 gap-1 px-2 text-xs"
                                  onClick={() => (article ? openEdit(article) : openNew(m))}
                                >
                                  {article ? <Pencil className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                  {article ? "编辑内容" : "写内容"}
                                </Button>
                                <ConfirmDialog
                                  title={`删除模块"${m.name}"？`}
                                  description="会连带删除其内容，且不可恢复。"
                                  onConfirm={() => removeModule(m)}
                                >
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </ConfirmDialog>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">
                  {categories.find((c) => c.id === activeCat)?.name}
                </h3>
                <PromptDialog
                  title={`在"${categories.find((c) => c.id === activeCat)?.name}"下新建模块`}
                  label="模块名称"
                  placeholder="输入模块名称"
                  onConfirm={(v) => {
                    const cat = categories.find((c) => c.id === activeCat)
                    if (cat) addModule(cat, v)
                  }}
                >
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    添加模块
                  </Button>
                </PromptDialog>
              </div>
              <div className="flex flex-col gap-2">
                {catModules(activeCat).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">暂无模块</p>
                ) : (
                  catModules(activeCat).map((m) => {
                    const article = moduleArticle(m.id)
                    return (
                      <Card key={m.id}>
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <LayoutGrid className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{m.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {article ? "已有内容" : "暂无内容"}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1.5">
                            <Button
                              size="sm"
                              variant={article ? "outline" : "default"}
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() => (article ? openEdit(article) : openNew(m))}
                            >
                              {article ? <Pencil className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                              {article ? "编辑内容" : "写内容"}
                            </Button>
                            <ConfirmDialog
                              title={`删除模块"${m.name}"？`}
                              description="会连带删除其内容，且不可恢复。"
                              onConfirm={() => removeModule(m)}
                            >
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑内容" : "写内容"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>所属模块</Label>
              <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {modules.find((m) => m.id === moduleId)?.name ?? "未选择模块"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>标题</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>标签（逗号分隔）</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：新手向" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>适用版本</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="如：2026.08" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>状态（H4 审核）</Label>
                <Select value={status} onValueChange={(v) => setStatus((v ?? "published") as "draft" | "pending" | "published")}>
                  <SelectTrigger>
                    <SelectValue getLabel={(v) =>
                      v === "pending" ? "待审核" : v === "draft" ? "草稿" : "已发布"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>内容（Markdown）</Label>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                rows={14}
                placeholder={"## 标题\n\n支持 **Markdown** 语法，如 `# 一级标题`、`- 列表`、`| 表格 |`"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={save} disabled={!title.trim() || !moduleId}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
