import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  SHOP_ITEMS,
  SHOP_PRIORITY_LABEL,
  sumHighPriorityYields,
  type ShopPriority,
} from "@/data/shop"

const priorityVariant: Record<ShopPriority, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
}

const order: Record<ShopPriority, number> = { high: 0, medium: 1, low: 2 }

export function ShopPanel() {
  // 按商店分组
  const groups = new Map<string, typeof SHOP_ITEMS>()
  for (const item of SHOP_ITEMS) {
    if (!groups.has(item.shop)) groups.set(item.shop, [])
    groups.get(item.shop)!.push(item)
  }

  const highYields = sumHighPriorityYields()

  return (
    <div className="flex flex-col gap-4">
      {/* 必换资源汇总 */}
      {highYields.length > 0 && (
        <Card className="border-primary/40">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              必换资源汇总
              <Badge variant="default" className="text-xs font-normal">
                每周白嫖
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {highYields.map((y) => (
                <div key={y.name} className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-primary">{y.amount}</span>
                  <span className="text-sm text-muted-foreground">{y.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              将全部"必换"项兑换后的每周保底产出（体力按约 300 计，神龛黑蛋按两周 1 颗折算）。
            </p>
          </CardContent>
        </Card>
      )}

      {[...groups.entries()].map(([shop, items]) => {
        const sorted = [...items].sort((a, b) => order[a.priority] - order[b.priority])
        const hasHigh = sorted.some((i) => i.priority === "high")
        return (
          <Card key={shop}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {shop}
                <Badge
                  variant={hasHigh ? "default" : "outline"}
                  className="text-xs font-normal"
                >
                  {hasHigh ? "有必换项" : "看需求"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col p-4 pt-1">
              {sorted.map((item, idx) => (
                <div key={item.id}>
                  {idx > 0 && <Separator className="my-2" />}
                  <div className="flex items-start gap-2 py-0.5">
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            item.priority === "low" && "text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        <Badge variant={priorityVariant[item.priority]}>
                          {SHOP_PRIORITY_LABEL[item.priority]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        每周限购 {item.limit.replace(/^每周\s*/, "")} · 消耗：{item.cost}
                      </p>
                      {item.note && <p className="text-xs text-muted-foreground/80">{item.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}