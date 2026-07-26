import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'brief.installDismissed'

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true
    if (standalone || dismissed) return

    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
    setIsIos(ios)

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    if (ios) setVisible(true)

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setVisible(false)
  }

  return (
    <div className="install-banner" role="dialog" aria-label="アプリをインストール">
      <img className="install-icon" src="/icons/icon-192.png" alt="" width={44} height={44} />
      <div className="install-copy">
        <p className="install-title">BRIEFをホーム画面へ</p>
        <p className="install-text">
          {isIos && !deferred
            ? '共有ボタンから「ホーム画面に追加」でインストールできます'
            : 'アプリとして起動でき、すぐ最新ニュースへ'}
        </p>
      </div>
      <div className="install-actions">
        {deferred && (
          <button type="button" className="install-cta" onClick={() => void install()}>
            追加
          </button>
        )}
        <button type="button" className="install-dismiss" onClick={dismiss} aria-label="閉じる">
          閉じる
        </button>
      </div>
    </div>
  )
}
