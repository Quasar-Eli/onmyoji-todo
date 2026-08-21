import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SHOP_ITEMS, SHOP_PRIORITY_LABEL, type ShopPriority } from "@/data/shop"

const priorityVariant: Record<ShopPriority, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
}

const order: Record<ShopPriority, number> = { high: 0, medium: 1, low: 2 }

export function ShopPanel() {
  const sorted = [...SHOP_ITEMS].sort((a, b) => order[a.priority] - order[b.priority])

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((item) => (
        <Card key={item.id} className="flex items-start gap-3 p-4">
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.name}</span>
              <Badge variant={priorityVariant[item.priority]}>
                {SHOP_PRIORITY_LABEL[item.priority]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Badge variant="outline" className="text-muted-foreground">
                  {item.shop}
                </Badge>
              </span>
              <span>每周 {item.limit}</span>
              <span>· 消耗：{item.cost}</span>
            </div>
            {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
          </div>
        </Card>
      ))}
    </div>
  )
}
