import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  title: string
  description?: string
  confirmText?: string
  onConfirm: () => void
  children: React.ReactNode
}

/** 确认弹窗：点按钮触发 */
export function ConfirmDialog({
  title,
  description,
  confirmText = "确认",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
      <span onClick={() => setOpen(true)}>{children}</span>
    </Dialog>
  )
}

interface PromptDialogProps {
  title: string
  label?: string
  placeholder?: string
  initialValue?: string
  confirmText?: string
  onConfirm: (value: string) => void
  children: React.ReactNode
}

/** 输入弹窗：点按钮触发 */
export function PromptDialog({
  title,
  label,
  placeholder,
  initialValue = "",
  confirmText = "确定",
  onConfirm,
  children,
}: PromptDialogProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initialValue)

  const openDialog = () => {
    setValue(initialValue)
    setOpen(true)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {label && <Label>{label}</Label>}
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                setOpen(false)
                onConfirm(value.trim())
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            disabled={!value.trim()}
            onClick={() => {
              setOpen(false)
              onConfirm(value.trim())
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
      <span onClick={openDialog}>{children}</span>
    </Dialog>
  )
}