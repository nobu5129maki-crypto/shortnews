# MYLINE — 興味だけのレーン

興味のある情報だけを、上スワイプでさくっと掴むニュースアプリ。

## デプロイ（都度アップロード）

コードを直したら、**毎回** GitHub と Vercel 本番へ上げます。

1. 変更を commit する  
2. `npm run ship` を実行する（現在ブランチを push し、`main` も更新）  
3. Vercel が `main` への push を受けて **Production** を自動デプロイ  
   - 本番: https://shortnews-theta.vercel.app  

Agent / Cursor でも同じ経路を必須化しています（`.cursor/rules/always-deploy.mdc`）。

任意: GitHub Secrets に `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` を入れると、Actions からも CLI 本番デプロイが走ります（未設定でも GitHub→Vercel 連携で本番更新されます）。
