<script setup lang="ts">
// Nuxt UI 內建元件的文字（深淺色切換、抽屜關閉等無障礙標籤）用繁體中文
import { zh_tw } from '@nuxt/ui/locale'

// 站內點概念卡（任何 /c/{id} 連結）都改成開彈窗，不換頁；用 Cmd/Ctrl/中鍵點仍然照常開新分頁。
// 加了 data-no-modal 的連結照常換頁（/c/{id} 頁面上的「上一則／下一則」）。
// 在 capture 階段攔截，比 NuxtLink 自己的點擊處理先執行。直接打開 /c/{id} 網址仍然是完整頁面。
const { id: conceptId, open } = useConceptModal()
const prefetchConcept = useConceptPrefetch()
const { baseURL } = useRuntimeConfig().app

/** 點的連結所在的 [data-concept-seq] 容器裡，所有概念卡 id（DOM 順序、去掉重複）：彈窗「上一則／下一則」的順序。容器的值有寫就照它 */
const sequenceAround = (link: Element): string[] | null => {
  const box = link.closest('[data-concept-seq]')
  if (!box) return null
  // 容器可以直接寫明順序（data-concept-seq="a,b,c"），例如名詞卡只有翻開的卡片才有連結
  const explicit = box.getAttribute('data-concept-seq')
  if (explicit) return explicit.split(',').filter(Boolean)
  const ids = [...box.querySelectorAll('a[href]')]
    .map(el => new URL(el.getAttribute('href')!, window.location.href).pathname)
    .map(p => (p.startsWith(baseURL) ? `/${p.slice(baseURL.length)}` : p).match(/^\/c\/([^/]+)\/?$/)?.[1])
    .filter((x): x is string => !!x)
    .map(decodeURIComponent)
  return [...new Set(ids)]
}

/** 連結指到哪張概念卡（/c/{id}）；不是概念卡連結回傳 null */
const conceptIdOfLink = (a: Element): string | null => {
  const url = new URL(a.getAttribute('href')!, window.location.href)
  if (url.origin !== window.location.origin) return null
  const path = url.pathname.startsWith(baseURL) ? `/${url.pathname.slice(baseURL.length)}` : url.pathname
  const id = path.match(/^\/c\/([^/]+)\/?$/)?.[1]
  return id ? decodeURIComponent(id) : null
}

onMounted(() => {
  // 滑鼠移到概念卡連結上就先抓資料，點下去彈窗馬上有內容
  document.addEventListener('pointerover', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]')
    const cid = a && conceptIdOfLink(a)
    if (cid) prefetchConcept(cid)
  }, { passive: true })

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element | null)?.closest?.('a[href]')
    if (!a || a.getAttribute('target') === '_blank' || a.hasAttribute('data-no-modal')) return
    const url = new URL(a.getAttribute('href')!, window.location.href)
    if (url.origin !== window.location.origin) return
    const path = url.pathname.startsWith(baseURL) ? `/${url.pathname.slice(baseURL.length)}` : url.pathname
    const id = path.match(/^\/c\/([^/]+)\/?$/)?.[1]
    if (!id) return
    e.preventDefault()
    e.stopPropagation()
    open(decodeURIComponent(id), sequenceAround(a))
  }, true)
})
</script>

<template>
  <UApp :locale="zh_tw">
    <NuxtPage />
    <!-- 打開時才載入（彈窗、概念卡內文、筆記編輯器都不放進每一頁的首次載入） -->
    <LazyConceptModal v-if="conceptId" />
    <ConfirmDialog />
  </UApp>
</template>
