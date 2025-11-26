import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Copy, Download, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryItem {
  id: number;
  resumeText: string;
  jobDescription: string;
  generatedContent: Record<string, string>;
  selectedItems: string[];
  createdAt: Date;
}

interface HistoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyItem: HistoryItem | null;
  onUseContent: (content: Record<string, string>) => void;
  onRegenerate: (resumeText: string, jobDescription: string, selectedItems: string[]) => void;
  allItems: Array<{ key: string; label: string }>;
}

export function HistoryDetailDialog({
  open,
  onOpenChange,
  historyItem,
  onUseContent,
  onRegenerate,
  allItems,
}: HistoryDetailDialogProps) {
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  if (!historyItem) return null;

  const handleEdit = (key: string, value: string) => {
    setEditedContent((prev) => ({ ...prev, [key]: value }));
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedContent = { ...historyItem.generatedContent, ...editedContent };
    onUseContent(updatedContent);
    toast.success('編集内容を保存しました');
    setIsEditing(false);
    setEditedContent({});
    onOpenChange(false);
  };

  const handleCopyItem = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('コピーしました');
  };

  const handleUseContent = () => {
    const updatedContent = { ...historyItem.generatedContent, ...editedContent };
    onUseContent(updatedContent);
    toast.success('この内容を使用します');
    onOpenChange(false);
  };

  const handleRegenerate = () => {
    onRegenerate(historyItem.resumeText, historyItem.jobDescription, historyItem.selectedItems);
    toast.success('再生成を開始します');
    onOpenChange(false);
  };

  const getItemLabel = (key: string) => {
    const item = allItems.find((i) => i.key === key);
    return item?.label || key;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>生成履歴の詳細</DialogTitle>
          <DialogDescription>
            生成日時: {new Date(historyItem.createdAt).toLocaleString('ja-JP')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 入力情報 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">入力情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">職務経歴書</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                  {historyItem.resumeText.substring(0, 200)}
                  {historyItem.resumeText.length > 200 && '...'}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">求人情報</Label>
                <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                  {historyItem.jobDescription.substring(0, 200)}
                  {historyItem.jobDescription.length > 200 && '...'}
                </div>
              </div>
            </div>
          </div>

          {/* 生成内容 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">生成内容</h3>
            {Object.entries(historyItem.generatedContent).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{getItemLabel(key)}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyItem(editedContent[key] || value)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={editedContent[key] !== undefined ? editedContent[key] : value}
                  onChange={(e) => handleEdit(key, e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {(editedContent[key] || value).length} 文字
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button variant="outline" onClick={handleRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            再生成
          </Button>
          {isEditing ? (
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              保存して使用
            </Button>
          ) : (
            <Button onClick={handleUseContent}>
              <Download className="h-4 w-4 mr-2" />
              この内容を使用
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
