import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Copy, RefreshCw, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type OutputItem = "summary" | "motivation" | "self_pr" | "why_company";

const OUTPUT_ITEMS: { value: OutputItem; label: string; defaultLimit: number }[] = [
  { value: "summary", label: "職務要約", defaultLimit: 350 },
  { value: "motivation", label: "志望動機", defaultLimit: 400 },
  { value: "self_pr", label: "自己PR", defaultLimit: 600 },
  { value: "why_company", label: "なぜ御社か", defaultLimit: 400 },
];

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<OutputItem[]>(["summary", "motivation", "self_pr", "why_company"]);
  const [charLimits, setCharLimits] = useState<Record<OutputItem, number>>({
    summary: 350,
    motivation: 400,
    self_pr: 600,
    why_company: 400,
  });
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const generateMutation = trpc.resume.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedContent(data);
      setShowResults(true);
      toast.success("生成が完了しました");
    },
    onError: (error) => {
      toast.error(`生成に失敗しました: ${error.message}`);
    },
  });

  const regenerateMutation = trpc.resume.regenerate.useMutation({
    onSuccess: (data, variables) => {
      setGeneratedContent((prev) => ({
        ...prev,
        [variables.item]: data.content,
      }));
      toast.success("再生成が完了しました");
    },
    onError: (error) => {
      toast.error(`再生成に失敗しました: ${error.message}`);
    },
  });

  const handleGenerate = () => {
    if (!resumeText.trim()) {
      toast.error("職務経歴書を入力してください");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("求人情報を入力してください");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("出力項目を選択してください");
      return;
    }

    generateMutation.mutate({
      resumeText,
      jobDescription,
      outputItems: selectedItems,
      charLimits: Object.fromEntries(
        selectedItems.map((item) => [item, charLimits[item]])
      ) as Record<OutputItem, number>,
    });
  };

  const handleRegenerate = (item: OutputItem) => {
    regenerateMutation.mutate({
      item,
      resumeText,
      jobDescription,
      charLimit: charLimits[item],
      previousContent: generatedContent[item],
    });
  };

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${label}をコピーしました`);
  };

  const toggleItem = (item: OutputItem) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleBack = () => {
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <Button variant="outline" onClick={handleBack} className="mb-4">
              ← 入力画面に戻る
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">生成結果</h1>
            <p className="text-gray-600">各項目をコピーまたは再生成できます</p>
          </div>

          <div className="space-y-6">
            {selectedItems.map((item) => {
              const itemConfig = OUTPUT_ITEMS.find((i) => i.value === item);
              if (!itemConfig) return null;

              const content = generatedContent[item] || "";
              const charCount = content.length;
              const limit = charLimits[item];
              const isOverLimit = charCount > limit;

              return (
                <Card key={item} className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{itemConfig.label}</CardTitle>
                        <CardDescription className={isOverLimit ? "text-red-500" : ""}>
                          {charCount}文字 / {limit}文字
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(content, itemConfig.label)}
                          disabled={!content}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          コピー
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerate(item)}
                          disabled={regenerateMutation.isPending}
                        >
                          {regenerateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                          )}
                          再生成
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-md">
                      {content || "生成中..."}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">職務経歴書最適化ツール</h1>
          <p className="text-xl text-gray-600">
            求人情報に合わせて、あなたの職務経歴書を最適化します
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">入力情報</CardTitle>
            <CardDescription>職務経歴書と求人情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resume" className="text-lg font-semibold">
                1. 職務経歴書
              </Label>
              <Textarea
                id="resume"
                placeholder="あなたの職務経歴書をここに貼り付けてください..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[200px] text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job" className="text-lg font-semibold">
                2. 求人情報
              </Label>
              <Textarea
                id="job"
                placeholder="応募する求人情報をここに貼り付けてください..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] text-base"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">3. 出力項目を選択</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OUTPUT_ITEMS.map((item) => (
                  <div key={item.value} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id={item.value}
                      checked={selectedItems.includes(item.value)}
                      onCheckedChange={() => toggleItem(item.value)}
                    />
                    <Label htmlFor={item.value} className="flex-1 cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">4. 文字数設定</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OUTPUT_ITEMS.map((item) => (
                  <div key={item.value} className="space-y-2">
                    <Label htmlFor={`limit-${item.value}`} className="text-sm">
                      {item.label}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`limit-${item.value}`}
                        type="number"
                        value={charLimits[item.value]}
                        onChange={(e) =>
                          setCharLimits((prev) => ({
                            ...prev,
                            [item.value]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-24"
                        min="0"
                      />
                      <span className="text-sm text-gray-600">文字</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                "生成開始"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
