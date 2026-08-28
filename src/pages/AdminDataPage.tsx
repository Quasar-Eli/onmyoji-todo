import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useIsSuperAdmin } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDocumentTitle } from "@/lib/seo"
import { Download, ScrollText } from "lucide-react"

interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  table_name: string
  meta: { title?: string } | null
  created_at: string
  username?: string
}

const ACTION_TEXT: Record<string, string> = {
  insert: "新增",
  update: "修改",
  delete: "删除",
}

/** 导出全站数据为 JSON 文件（I1） */
const exportAllData = async (): Promise<string | null> => {
  const [gRes, aRes, sRes, iRes, cRes] = await Promise.all([
    supabase.from("games").select("*"),
    supabase.from("articles").select("*"),
    supabase.from("shikigami").select("*"),
    supabase.from("items").select("*"),
    supabase.from("comments").select("*"),
  ])
  if (gRes.error || aRes.error || sRes.error || iRes.error || cRes.error) {
    return "部分数据导出失败，请重试"
  }
  const payload = {
    exported_at: new Date().toISOString(),
    games: gRes.data,
    articles: aRes.data,
    shikigami: sRes.data,
    items: iRes.data,
    comments: cRes.data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `wiki-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  return null
}

/** H3 操作日志 + I1 数据导出（仅超管） */
export function AdminDataPage() {
  const isSuper = useIsSuperAdmin()

  useDocumentTitle("数据管理")

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    const rows = (data as AuditLog[] | null) ?? []
    // 关联操作人昵称
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[]
    let nameMap: Record<string, string> = {}
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", actorIds)
      if (profiles) nameMap = Object.fromEntries(profiles.map((p) => [p.id, p.username]))
    }
    setLogs(rows.map((r) => ({ ...r, username: nameMap[r.actor_id ?? ""] })))
    setLoading(false)
  }

  useEffect(() => {
    if (isSuper) void load()
  }, [isSuper])

  const doExport = async () => {
    setExporting(true)
    setMsg(null)
    const err = await exportAllData()
    setExporting(false)
    setMsg(err ?? "导出完成，已开始下载")
  }

  if (!isSuper) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        仅超管可访问。
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <ScrollText className="h-6 w-6 text-primary" />
        数据管理
      </h1>

      {/* I1：数据导出 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>数据导出</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            导出全站数据（游戏/文章/式神/装备/评论）为 JSON 备份文件，便于迁移与存档。
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => void doExport()} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "导出中..." : "导出备份"}
            </Button>
            {msg && <span className="text-sm text-primary">{msg}</span>}
          </div>
        </CardContent>
      </Card>

      {/* H3：操作日志 */}
      <Card>
        <CardHeader>
          <CardTitle>操作日志（最近 50 条）</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">加载中...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">暂无操作记录</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {logs.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{l.username ?? "系统"}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                      {ACTION_TEXT[l.action] ?? l.action}
                    </span>
                    <span className="text-muted-foreground">{l.meta?.title ?? l.table_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
