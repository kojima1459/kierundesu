import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";

interface LinkedInShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultText: string;
  onShare: (text: string) => void;
}

export function LinkedInShareDialog({
  open,
  onOpenChange,
  defaultText,
  onShare,
}: LinkedInShareDialogProps) {
  const [shareText, setShareText] = useState(defaultText);

  // ダイアログが開かれるたびにデフォルトテキストをリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setShareText(defaultText);
    }
    onOpenChange(newOpen);
  };

  const handleShare = () => {
    onShare(shareText);
    onOpenChange(false);
  };

  const handleCopyOnly = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        toast.success("クリップボードにコピーしました");
      }).catch((err) => {
        console.error('Failed to copy text:', err);
        toast.error("コピーに失敗しました");
      });
    }
  };

  const charCount = shareText.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-[#0A66C2]" />
            LinkedInでシェア
          </DialogTitle>
          <DialogDescription>
            シェアするテキストを編集できます。編集後、「シェア」ボタンをクリックしてLinkedInで投稿してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">シェアテキスト</label>
              <span className="text-xs text-muted-foreground">
                {charCount.toLocaleString()} 文字
              </span>
            </div>
            <Textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="シェアするテキストを入力してください..."
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">プレビュー</h4>
            <div className="text-sm whitespace-pre-wrap break-words">
              {shareText || "（テキストが入力されていません）"}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyOnly}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            コピーのみ
          </Button>
          <Button
            onClick={handleShare}
            className="bg-[#0A66C2] text-white hover:bg-[#004182] flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            LinkedInでシェア
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
