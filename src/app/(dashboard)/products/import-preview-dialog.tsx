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
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  previewData: {
    success: Partial<Product>[]
    errors: { row: number; error: string }[]
  }
}

export function ImportPreviewDialog({
  isOpen,
  onClose,
  onConfirm,
  previewData
}: ImportPreviewDialogProps) {
  const { success, errors } = previewData

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>导入预览</DialogTitle>
          <DialogDescription>
            请确保：
            1. Excel 文件中的图片是直接粘贴到单元格中的
            2. 图片格式为 JPG 或 PNG
            3. 图片大小不超过 2MB
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
                    </tr>
                  </thead>
                  <tbody>
                    {success.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.itemNo}</td>
                        <td className="p-2">{product.description}</td>
                        <td className="p-2">{product.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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