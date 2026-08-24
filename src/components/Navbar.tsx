import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Gamepad2, LayoutDashboard, LogOut, Settings, User } from "lucide-react"

export function Navbar() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <Gamepad2 className="h-5 w-5 text-primary" />
          <span>游戏Wiki</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar>
                  <AvatarFallback>
                    {profile?.username?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{profile?.username ?? "用户"}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {profile?.username ?? "未登录"}
                  {profile && profile.role !== "user" && (
                    <span className="ml-1 text-xs text-primary">
                      {profile.role === "super_admin" ? "(超管)" : "(管理员)"}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  个人设置
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/admin")}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  管理后台
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    navigate("/")
                  }}
                  className="cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <User className="h-4 w-4" />
                  登录
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">注册</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}