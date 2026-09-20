/**
 * 処理全体の締め切りを表す小さなユーティリティ。
 * Edge Function は 25 秒以内にレスポンスを返し始める必要があるため、
 * RSS 収集 → 本文補完 → 翻訳の各段階が残り時間を見て自分で打ち切れるようにする。
 */
export class Deadline {
  private readonly endsAt: number

  private constructor(endsAt: number) {
    this.endsAt = endsAt
  }

  static after(ms: number): Deadline {
    return new Deadline(Date.now() + Math.max(0, ms))
  }

  /** 残りミリ秒（0 未満にはならない） */
  remaining(): number {
    return Math.max(0, this.endsAt - Date.now())
  }

  /** 残りが margin 以下なら true */
  expired(margin = 0): boolean {
    return this.remaining() <= margin
  }

  /** fetch の timeout 用。希望値と残り時間の小さい方（最低 1ms） */
  timeout(preferredMs: number): number {
    return Math.max(1, Math.min(preferredMs, this.remaining()))
  }

  /** この締め切りより手前で終わる子締め切り（残り時間の一部だけ使う） */
  sub(ms: number, reserveMs = 0): Deadline {
    const usable = Math.max(0, this.remaining() - reserveMs)
    return Deadline.after(Math.min(ms, usable))
  }
}
