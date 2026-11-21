import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// ログイン画面と同じ sw.js を共有する。更新のたびに再読み込みすると画面が往復する。
registerSW({
  immediate: true,
  onNeedReload() {},
  onRegisteredSW(_url, registration) {
    void registration?.update()
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
