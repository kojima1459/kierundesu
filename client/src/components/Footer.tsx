import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* アプリ情報 */}
          <div>
            <h3 className="font-semibold mb-3">{APP_TITLE}</h3>
            <p className="text-sm text-muted-foreground">
              AI技術を活用して職務経歴書を求人情報に最適化するWebアプリケーション
            </p>
          </div>

          {/* リンク */}
          <div>
            <h3 className="font-semibold mb-3">リンク</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    ホーム
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/guide">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    ガイド・チュートリアル
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/my-templates">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    マイテンプレート
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/favorites">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    お気に入り
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="font-semibold mb-3">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy">
                  <a className="text-muted-foreground hover:text-primary transition-colors">
                    プライバシーポリシー
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} {APP_TITLE}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
