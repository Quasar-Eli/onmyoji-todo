import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, Gauge, TrendingUp } from "lucide-react"

const num = (v: string) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

/** D2：伤害计算器（期望伤害） */
function DamageCalculator() {
  const [baseAtk, setBaseAtk] = useState("8000")
  const [atkBonus, setAtkBonus] = useState("80")
  const [critRate, setCritRate] = useState("100")
  const [critDmg, setCritDmg] = useState("250")
  const [skillMult, setSkillMult] = useState("300")
  const [dmgBonus, setDmgBonus] = useState("20")

  const a = num(baseAtk)
  const ab = num(atkBonus) / 100
  const cr = num(critRate) / 100
  const cd = num(critDmg) / 100
  const sm = num(skillMult) / 100
  const db = num(dmgBonus) / 100

  const avgAtk = a * (1 + ab)
  const expected = avgAtk * sm * (1 + cr * (cd - 1)) * (1 + db)
  const critHit = avgAtk * sm * cd * (1 + db)
  const noCrit = avgAtk * sm * (1 + db)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          伤害计算器
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "基础攻击", value: baseAtk, set: setBaseAtk },
            { label: "攻击加成 %", value: atkBonus, set: setAtkBonus },
            { label: "暴击率 %", value: critRate, set: setCritRate },
            { label: "爆伤 %", value: critDmg, set: setCritDmg },
            { label: "技能系数 %", value: skillMult, set: setSkillMult },
            { label: "伤害加成 %", value: dmgBonus, set: setDmgBonus },
          ].map((f) => (
            <div key={f.label} className="flex flex-col gap-1.5">
              <Label>{f.label}</Label>
              <Input type="number" value={f.value} onChange={(e) => f.set(e.target.value)} />
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">期望伤害</p>
            <p className="text-xl font-bold text-primary">{Math.round(expected).toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">暴击伤害</p>
            <p className="text-xl font-bold">{Math.round(critHit).toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">不暴击</p>
            <p className="text-xl font-bold">{Math.round(noCrit).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** D3：速度阈值计算器（拉条后二速阈值） */
function SpeedCalculator() {
  const [speed1, setSpeed1] = useState("242")
  const [pull, setPull] = useState("30")

  const s1 = num(speed1)
  const p = num(pull) / 100
  const threshold = s1 * (1 - p)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          速度阈值计算器
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>一速（面板速度）</Label>
            <Input type="number" value={speed1} onChange={(e) => setSpeed1(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>拉条百分比 %</Label>
            <Input type="number" value={pull} onChange={(e) => setPull(e.target.value)} />
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-primary/10 p-3 text-center text-sm">
          二速需 ≥ <span className="text-lg font-bold text-primary">{Math.ceil(threshold)}</span>
          才能保证不被对方插队（{p * 100}% 拉条）
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0.7, 0.75, 0.8].map((r) => (
            <button
              key={r}
              onClick={() => setPull(String(r * 100))}
              className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-accent"
            >
              {r * 100}% 模板（二速 {Math.ceil(s1 * (1 - r))}）
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/** 工具中心：作为栏目内功能（/game/:slug/tools） */
export function ToolsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [game, setGame] = useState<Game | null>(null)

  useDocumentTitle(game ? `${game.name} · 工具` : "工具中心", "伤害计算器与速度阈值计算")

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const { data } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle()
      setGame((data as Game) ?? null)
    })()
  }, [slug])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {game && (
        <Link
          to={`/game/${game.slug}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回 {game.name}
        </Link>
      )}
      <h1 className="mb-2 text-3xl font-bold">工具中心</h1>
      <p className="mb-6 text-muted-foreground">常用战斗数值计算小工具，纯本地计算，不涉及账号数据</p>
      <div className="flex flex-col gap-6">
        <DamageCalculator />
        <SpeedCalculator />
      </div>
    </div>
  )
}
