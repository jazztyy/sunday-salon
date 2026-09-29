<script setup lang="ts">
// 討論題卡片：先自己想，按下「我想好了」才打開 Kagan 的觀點與影片段落。
// 打開狀態只在這次瀏覽有效，不存進瀏覽器。
import type { DiscussItem, Session } from '~/types/session'

defineProps<{ session: Session, item: DiscussItem }>()

const open = ref(false)
const panelId = useId()
</script>

<template>
  <div class="flex flex-col gap-2 rounded-card border border-default bg-elevated p-3.5">
    <p class="text-body font-medium text-highlighted">
      {{ item.q }}
      <UBadge
        v-if="item.ext"
        label="延伸"
        color="secondary"
        variant="soft"
        class="ms-1.5 rounded-tag bg-secondary-soft px-1.5 py-0 align-middle font-medium text-label"
      />
    </p>
    <p v-if="item.note" class="text-small text-muted">{{ item.note }}</p>

    <UButton
      color="neutral"
      variant="ghost"
      class="self-start rounded-control px-2 text-ui"
      :label="open ? '收起' : '我想好了，看 Kagan 怎麼說'"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    />

    <div v-show="open" :id="panelId" class="flex flex-col gap-2 rounded-control bg-accented p-3">
      <p class="text-small leading-relaxed text-toned">{{ item.answer }}</p>
      <ul class="flex flex-wrap gap-x-4 gap-y-1">
        <li v-for="(r, k) in item.refs" :key="k">
          <VideoLink :vid="r[0]" :t="r[1]" class="font-mono text-meta">▸ {{ refLabel(session, r) }}</VideoLink>
        </li>
      </ul>
    </div>
  </div>
</template>
