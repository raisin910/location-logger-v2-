# 位置情報ロガー V2

位置情報を記録し、地図上で表示できるウェブアプリケーションです。

## 機能

- 定期的な位置情報の取得と記録
- 記録したデータの地図表示
- Google スプレッドシートへのデータ送信
- データのJSONファイルダウンロード

## 開発

### 要件

- Node.js (ビルドスクリプト用)
- Google Maps JavaScript API キー
- Google Apps Script (データ保存用)

### ローカル開発

1. リポジトリをクローン
2. 依存関係をインストール: `npm install`
3. `env.js` にGoogle Maps API キーを設定
4. ローカルサーバーで実行 (Live Server など)

### Vercelへのデプロイ

1. GitHubリポジトリと連携
2. 環境変数 `GOOGLE_MAPS_API_KEY` を設定
3. デプロイ
