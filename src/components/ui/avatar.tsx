import { Avatar as AvatarPrimitive } from "@base-ui-components/react/avatar"
import { cn } from "@/lib/utils"

const Avatar = ({ className, ...props }: AvatarPrimitive.Root.Props) => (
  <AvatarPrimitive.Root
    className={cn("relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
)

const AvatarFallback = ({ className, ...props }: AvatarPrimitive.Fallback.Props) => (
  <AvatarPrimitive.Fallback
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary",
      className
    )}
    {...props}
  />
)

export { Avatar, AvatarFallback }