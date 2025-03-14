const fs = require('fs-extra');

// 環境変数が存在するか確認
const apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

console.log('ビルドプロセスを開始します...');

// env.js ファイルを生成
const envContent = `// このファイルは自動生成されました - 編集しないでください
window.GOOGLE_MAPS_API_KEY = '${apiKey}';`;

try {
  fs.writeFileSync('./env.js', envContent);
  console.log('環境変数が env.js に正常に書き込まれました');
} catch (error) {
  console.error('env.js の作成中にエラーが発生しました:', error);
  process.exit(1);
}

console.log('ビルドプロセスが完了しました');
