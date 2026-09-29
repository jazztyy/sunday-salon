<script setup lang="ts">
// 討論題卡片：先自己想（可以寫下「我的想法」），按下「我想好了」才打開 Kagan 的觀點與影片段落。
// 打開 Kagan 觀點的狀態只在這次瀏覽有效；「我的想法」存在瀏覽器（useDiscussNotes）。
// 兩者都打開時並排（窄螢幕上下排），方便對照自己和 Kagan 的想法。
import type { DiscussItem, Session } from '~/types/session'

const props = defineProps<{ session: Session, item: DiscussItem }>()

const open = ref(false)
const panelId = useId()
const noteId = useId()

const { getNote, setNote } = useDiscussNotes(props.session.slug)
const note = computed({
  get: () => getNote(props.item),
  set: (text: string) => setNote(props.item, text),
})

// 已經有筆記就直接顯示；沒有的話等使用者按「寫下我的想法」
const writingRequested = ref(false)
const writing = computed(() => writingRequested.value || !!note.value)

const noteBox = useTemplateRef<{ textareaRef?: HTMLTextAreaElement }>('noteBox')
const startWriting = async () => {
  writingRequested.value = true
  await nextTick()
  noteBox.value?.textareaRef?.focus()
}
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
        v-if="!writing"
        color="neutral"
        variant="ghost"
        icon="i-lucide-pencil-line"
        label="寫下我的想法"
        class="rounded-control px-2.5 py-1.5 text-ui text-muted hover:bg-accented hover:text-highlighted"
        @click="startWriting"
      />
    </div>

    <div v-if="writing || open" class="grid gap-3" :class="{ 'md:grid-cols-2': writing && open }">
      <div v-if="writing" class="flex flex-col gap-1.5">
        <label :for="noteId" class="text-meta font-medium text-muted">我的想法<span class="font-normal text-dimmed">・只存在這個瀏覽器</span></label>
        <UTextarea
          :id="noteId"
          ref="noteBox"
          v-model="note"
          autoresize
          :rows="3"
          :maxrows="12"
          placeholder="先寫下你的想法，再看 Kagan 怎麼說"
          :ui="{ base: 'text-body-sm leading-relaxed' }"
        />
      </div>

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
