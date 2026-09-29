// 內嵌 YouTube 播放器的共用狀態。規格見 SPEC.md「播放器規格」。
//
// - embed：YouTube IFrame API 載入成功、播放器可用。false 時所有 <VideoLink> 退回一般連結（開新分頁）。
// - playing：手機版是否展開固定在頂部的播放器。
// - vid / seconds：目前的影片與播放秒數（每秒更新），用來標出目前章節。
// - selected：使用者「選擇的講座」。左側子分頁和右側章節的講座按鈕都用 select() 設定，
//   兩邊互相跟隨；點參考段落跳到別支影片只改 vid，不改 selected（只是去看一下，不是換講座）。

interface YTPlayer {
  loadVideoById: (opts: { videoId: string, startSeconds?: number }) => void
  cueVideoById: (opts: { videoId: string, startSeconds?: number }) => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  destroy: () => void
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

let yt: YTPlayer | null = null
let ready = false
let pending: [string, number] | null = null
let pendingCue: string | null = null
let timer: ReturnType<typeof setInterval> | null = null
let apiPromise: Promise<void> | null = null

const loadApi = (): Promise<void> => {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve()
    window.onYouTubeIframeAPIReady = () => resolve()
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.onerror = () => reject(new Error('YouTube API 載入失敗'))
    document.head.appendChild(tag)
  })
  return apiPromise
}

export const usePlayer = () => {
  const embed = useState('player-embed', () => false)
  const playing = useState('player-playing', () => false)
  const vid = useState<string | null>('player-vid', () => null)
  const seconds = useState('player-seconds', () => 0)
  const selected = useState<string | null>('player-selected', () => null)

  /** 在指定元素上建立播放器。只在 client 端、由 <VideoPanel> 呼叫一次。 */
  const mount = async (el: HTMLElement, firstVideoId: string) => {
    try {
      await loadApi()
    } catch {
      embed.value = false
      return
    }
    embed.value = true
    vid.value = firstVideoId
    yt = new window.YT!.Player(el, {
      videoId: firstVideoId,
      playerVars: { rel: 0, playsinline: 1, hl: 'zh-TW', cc_lang_pref: 'zh-Hant' },
      events: {
        onReady: () => {
          ready = true
          if (pending) {
            const [id, t] = pending
            pending = null
            play(id, t)
          } else if (pendingCue) {
            const id = pendingCue
            pendingCue = null
            cue(id)
          }
        },
      },
    })
    timer = setInterval(() => {
      if (ready && yt) seconds.value = yt.getCurrentTime() || 0
    }, 1000)
  }

  const unmount = () => {
    if (timer) clearInterval(timer)
    yt?.destroy()
    yt = null
    ready = false
    embed.value = false
  }

  /** 跳到指定影片的指定秒數並播放 */
  const play = (id: string, t = 0) => {
    playing.value = true
    if (!ready || !yt) {
      pending = [id, t]
      return
    }
    if (vid.value !== id) {
      yt.loadVideoById({ videoId: id, startSeconds: t })
      vid.value = id
    } else {
      yt.seekTo(t, true)
      yt.playVideo()
    }
    seconds.value = t
  }

  /** 換成指定影片但不播放（「邊看邊想」切換子分頁時，讓右側跟著左側） */
  const cue = (id: string) => {
    if (!ready || !yt) {
      pendingCue = id
      return
    }
    if (vid.value === id) return
    yt.cueVideoById({ videoId: id })
    vid.value = id
    seconds.value = 0
  }

  /** 選擇講座：播放器換成這支影片（不播放），左側子分頁與右側章節清單都會跟著換 */
  const select = (id: string) => {
    selected.value = id
    cue(id)
  }

  /** 手機版收起播放器 */
  const hide = () => {
    yt?.pauseVideo()
    playing.value = false
  }

  return { embed, playing, vid, seconds, selected, mount, unmount, play, cue, select, hide }
}
