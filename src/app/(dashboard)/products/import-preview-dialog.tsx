import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Product } from "@prisma/client"

interface ImportPreviewDialogProps {
  data: {
    success: Partial<Product>[]
    errors: { row: number; error: string }[]
  } | null
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

export function ImportPreviewDialog({
  data,
  onConfirm,
  onCancel,
  isOpen
}: ImportPreviewDialogProps) {
  if (!data) return null

  const { success, errors } = data

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>导入预览</DialogTitle>
          <DialogDescription>
            请确认导入的数据是否正确
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>总计: {success.length + errors.length} 条数据</span>
            <span className="text-green-600">成功: {success.length} 条</span>
            <span className="text-red-600">失败: {errors.length} 条</span>
          </div>

          {errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-red-600">错误详情：</h3>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {errors.map(({ row, error }, index) => (
                  <div key={index} className="text-sm text-red-600">
                    第 {row} 行: {error}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {success.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-green-600">成功数据预览：</h3>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">商品编号</th>
                      <th className="p-2 text-left">商品描述</th>
                      <th className="p-2 text-left">成本</th>
                      <th className="p-2 text-left">图片</th>
                    </tr>
                  </thead>
                  <tbody>
                    {success.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.itemNo}</td>
                        <td className="p-2">{product.description}</td>
                        <td className="p-2">{product.cost}</td>
                        <td className="p-2">{product.picture ? '有' : '无'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={success.length === 0}
          >
            确认导入 ({success.length} 条)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 