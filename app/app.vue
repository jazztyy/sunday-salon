<script setup lang="ts">
// Nuxt UI 內建元件的文字（深淺色切換、抽屜關閉等無障礙標籤）用繁體中文
import { zh_tw } from '@nuxt/ui/locale'

// 站內點概念卡（任何 /c/{id} 連結）都改成開彈窗，不換頁；用 Cmd/Ctrl/中鍵點仍然照常開新分頁。
// 在 capture 階段攔截，比 NuxtLink 自己的點擊處理先執行。直接打開 /c/{id} 網址仍然是完整頁面。
const { open } = useConceptModal()
const { baseURL } = useRuntimeConfig().app

onMounted(() => {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = (e.target as Element | null)?.closest?.('a[href]')
    if (!a || a.getAttribute('target') === '_blank') return
    const url = new URL(a.getAttribute('href')!, window.location.href)
    if (url.origin !== window.location.origin) return
    const path = url.pathname.startsWith(baseURL) ? `/${url.pathname.slice(baseURL.length)}` : url.pathname
    const id = path.match(/^\/c\/([^/]+)\/?$/)?.[1]
    if (!id) return
    e.preventDefault()
    e.stopPropagation()
    open(decodeURIComponent(id))
  }, true)
})
</script>

<template>
  <UApp :locale="zh_tw">
    <NuxtPage />
    <ConceptModal />
    <ConfirmDialog />
  </UApp>
</template>
