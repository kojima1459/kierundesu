import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [keyType, setKeyType] = useState("openai");
  const [showApiKey, setShowApiKey] = useState(false);

  // APIキー取得
  const { data: apiKeyData, isLoading: apiKeyLoading, refetch: refetchApiKey } = trpc.apiKey.get.useQuery();

  // APIキー保存
  const saveApiKeyMutation = trpc.apiKey.save.useMutation({
    onSuccess: () => {
      toast.success("APIキーを保存しました");
      setApiKey("");
      setShowApiKey(false);
      refetchApiKey();
    },
    onError: (error) => {
      toast.error(`APIキーの保存に失敗しました: ${error.message}`);
    },
  });

  // APIキー削除
  const deleteApiKeyMutation = trpc.apiKey.delete.useMutation({
    onSuccess: () => {
      toast.success("APIキーを削除しました");
      refetchApiKey();
    },
    onError: (error) => {
      toast.error(`APIキーの削除に失敗しました: ${error.message}`);
    },
  });

  useEffect(() => {
    if (apiKeyData?.keyType) {
      setKeyType(apiKeyData.keyType);
    }
  }, [apiKeyData]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("APIキーを入力してください");
      return;
    }
    saveApiKeyMutation.mutate({ apiKey, keyType });
  };

  const handleDeleteApiKey = () => {
    if (confirm("本当にAPIキーを削除しますか？")) {
      deleteApiKeyMutation.mutate();
    }
  };

  if (authLoading || apiKeyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{APP_TITLE}</h1>
          <p className="text-muted-foreground mb-6">設定画面にアクセスするにはログインが必要です</p>
          <Button asChild>
            <a href={getLoginUrl()}>ログイン</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
          <h1 className="text-3xl font-bold">{APP_TITLE} - 設定</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>APIキー設定</CardTitle>
            <CardDescription>
              1兆トークンキャンペーン終了後、個人のAPIキーを使用する場合はこちらで設定してください。
              APIキーは暗号化してデータベースに保存されます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiKeyData?.hasKey && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">APIキーが設定されています</p>
                    <p className="text-sm text-green-700 mt-1">
                      マスク済みキー: {apiKeyData.maskedKey}
                    </p>
                    <p className="text-sm text-green-700">種類: {apiKeyData.keyType}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteApiKey}
                    disabled={deleteApiKeyMutation.isPending}
                  >
                    {deleteApiKeyMutation.isPending ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyType">APIキーの種類</Label>
                <Select value={keyType} onValueChange={setKeyType}>
                  <SelectTrigger id="keyType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">APIキー</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {keyType === "openai"
                    ? "OpenAI APIキーは https://platform.openai.com/api-keys から取得できます"
                    : "Anthropic APIキーは https://console.anthropic.com/ から取得できます"}
                </p>
              </div>

              <Button
                onClick={handleSaveApiKey}
                disabled={saveApiKeyMutation.isPending || !apiKey.trim()}
                className="w-full"
              >
                {saveApiKeyMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    APIキーを保存
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" asChild>
                <a href="/">ホームに戻る</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
