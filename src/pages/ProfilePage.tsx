import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

export function ProfilePage() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 text-center text-muted-foreground">
        请先登录。
      </div>
    )
  }

  const isSuper = profile?.role === "super_admin"

  const saveAvatar = async () => {
    if (!user) return
    setSaving(true)
    setMsg(null)
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl.trim() || null })
      .eq("id", user.id)
    setSaving(false)
    if (error) {
      setMsg("保存失败：" + error.message)
    } else {
      setMsg("已保存")
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-20 w-20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <AvatarFallback className="text-2xl">
                {profile?.username?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="mt-2">{profile?.username}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {profile?.role === "super_admin"
              ? "超管"
              : profile?.role === "global_editor"
                ? "所有权限"
                : profile?.role === "game_admin"
                  ? "栏目管理员"
                  : "普通用户"}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!isSuper && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>头像 URL</Label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                />
                <p className="text-xs text-muted-foreground">
                  填写一个图片地址即可更换头像。
                </p>
              </div>
              <Button onClick={saveAvatar} disabled={saving} className="w-full">
                <Camera className="h-4 w-4" />
                {saving ? "保存中..." : "保存头像"}
              </Button>
            </>
          )}
          {isSuper && (
            <p className="text-sm text-muted-foreground">超管账号无需设置头像。</p>
          )}
          {msg && <p className="text-sm text-primary">{msg}</p>}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              logout()
              navigate("/")
            }}
          >
            退出登录
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}