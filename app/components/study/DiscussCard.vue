<script setup lang="ts">
// 討論題卡片：先自己想（可以寫下「我的想法」），按下「我想好了」才打開 Kagan 的觀點與影片段落。
// 打開 Kagan 觀點的狀態只在這次瀏覽有效；「我的想法」存在瀏覽器（useDiscussNotes）。
// 「我的想法」和其他地方的筆記一樣是一張卡片＋Markdown 編輯器（<NoteField>），內容也會收進「筆記」頁。
// 兩者都打開時並排（窄螢幕上下排），方便對照自己和 Kagan 的想法。
import type { DiscussItem, Session } from '~/types/session'

const props = defineProps<{ session: Session, item: DiscussItem }>()

const open = ref(false)
const panelId = useId()

const { getNote, setNote } = useDiscussNotes(props.session.slug)
const note = computed({
  get: () => getNote(props.item),
  set: (text: string) => setNote(props.item, text),
})

// 已經有筆記就直接顯示；沒有的話等使用者按「寫下我的想法」。打開後隨時可以收起（有筆記也可以），只在這次瀏覽有效
const noteToggled = ref<boolean | null>(null)
const writing = computed(() => noteToggled.value ?? !!note.value)
const noteToggleLabel = computed(() => writing.value ? '收起我的想法' : note.value ? '看我的想法' : '寫下我的想法')
</script>

<template>
  <div class="flex flex-col gap-2.5 rounded-card border border-default bg-elevated p-3.5">
    <div class="flex flex-col gap-1">
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
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <!-- 揭曉按鈕：暮色藍外框＋淡底＋箭頭，看得出是可以點的；打開後箭頭轉向 -->
      <UButton
        color="secondary"
        variant="subtle"
        trailing-icon="i-lucide-chevron-down"
        class="rounded-control px-3 py-1.5 text-ui font-medium hover:bg-secondary/25 hover:ring-secondary"
        :ui="{ trailingIcon: ['size-4 transition-transform', open ? 'rotate-180' : ''] }"
        :label="open ? '收起 Kagan 的觀點' : '我想好了，看 Kagan 怎麼說'"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click="open = !open"
      />
      <UButton
        color="neutral"
        variant="ghost"
        :icon="writing ? 'i-lucide-chevron-up' : 'i-lucide-pencil-line'"
        :label="noteToggleLabel"
        class="rounded-control px-2.5 py-1.5 text-ui text-muted hover:bg-accented hover:text-highlighted"
        :aria-expanded="writing"
        @click="noteToggled = !writing"
      />
    </div>

    <div v-if="writing || open" class="grid gap-3" :class="{ 'md:grid-cols-2': writing && open }">
      <NoteField
        v-if="writing"
        v-model="note"
        label="我的想法"
        hint="支援 Markdown，會收進「筆記」頁"
        placeholder="先寫下你的想法，再看 Kagan 怎麼說"
        :autofocus="noteToggled === true && !note"
        closable
        close-label="收起我的想法"
        @close="noteToggled = false"
      />

      <div v-show="open" :id="panelId" class="flex flex-col gap-2 rounded-control bg-accented p-3">
        <span class="text-meta font-medium text-muted">Kagan 怎麼說</span>
        <p class="text-small leading-relaxed text-toned">{{ item.answer }}</p>
        <ul class="flex flex-wrap gap-x-4 gap-y-1">
          <li v-for="(r, k) in item.refs" :key="k">
            <VideoLink :vid="r[0]" :t="r[1]" class="font-mono text-meta">▸ {{ refLabel(session, r) }}</VideoLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
