<script lang="ts">
// /review 設定欄的「範圍」：上面三個預設 chip（全部討論過的／最近 4 場／自己選），
// 選「自己選」時下面才出現依月份分組的場次勾選清單。只負責畫面，各範圍的題數和實際的場次由頁面算好傳進來。
// 月份新的在前；最近兩個月展開，更早的收成一行「▸ 9 月（4 場）」，點了才展開。
// 場次跨了不只一年時，月份標題才加年份。

export type ScopeMode = 'discussed' | 'recent' | 'custom'

export interface ScopeSession {
  slug: string
  /** YYYY-MM-DD */
  date: string
  /** 「10/4 靈魂與永生」 */
  chip: string
  /** 還沒討論的場次，沒選時淡一點 */
  upcoming?: boolean
}
</script>

<script setup lang="ts">
const props = defineProps<{
  /** 全部場次，新的在前 */
  sessions: ScopeSession[]
  /** 各範圍可以出的題數；custom 只在「自己選」時顯示 */
  counts: Record<ScopeMode, number>
}>()

const mode = defineModel<ScopeMode>('mode', { required: true })
const slugs = defineModel<string[]>('slugs', { required: true })

const options = computed(() => [
  { value: 'discussed' as const, label: '全部討論過的', count: props.counts.discussed },
  { value: 'recent' as const, label: '最近 4 場', count: props.counts.recent },
  { value: 'custom' as const, label: '自己選', count: mode.value === 'custom' ? props.counts.custom : undefined },
])

const picked = computed(() => new Set(slugs.value))

/** 依月份（YYYY-MM）分組，順序跟著 sessions（新的在前） */
const months = computed(() => {
  const groups = new Map<string, ScopeSession[]>()
  for (const s of props.sessions) {
    const key = s.date.slice(0, 7)
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  const years = new Set([...groups.keys()].map(k => k.slice(0, 4)))
  return [...groups].map(([key, list]) => {
    const [y, m] = key.split('-')
    return { key, list, label: years.size > 1 ? `${y} 年 ${Number(m)} 月` : `${Number(m)} 月` }
  })
})

/** 展開的月份：預設是最近兩個月 */
const open = ref(new Set<string>())
let opened = false
watchEffect(() => {
  if (opened || !months.value.length) return
  open.value = new Set(months.value.slice(0, 2).map(m => m.key))
  opened = true
})
const toggleMonth = (key: string) => {
  const next = new Set(open.value)
  if (!next.delete(key)) next.add(key)
  open.value = next
}

const pickedIn = (list: ScopeSession[]) => list.filter(s => picked.value.has(s.slug)).length

/** 這個月全選；已經全選了就整個月取消 */
const toggleAll = (list: ScopeSession[]) => {
  const inMonth = new Set(list.map(s => s.slug))
  const rest = slugs.value.filter(v => !inMonth.has(v))
  slugs.value = pickedIn(list) === list.length ? rest : [...rest, ...list.map(s => s.slug)]
}

const toggle = (slug: string) => {
  slugs.value = picked.value.has(slug) ? slugs.value.filter(v => v !== slug) : [...slugs.value, slug]
}

/** 「10/4 靈魂與永生」→ ['10/4', '靈魂與永生']（和 <FilterChips list> 一樣） */
const splitDate = (text: string): [string, string] => {
  const m = text.match(/^(\d{1,2}\/\d{1,2})\s+(.+)$/)
  return m ? [m[1]!, m[2]!] : ['', text]
}

const id = useId()
</script>

<template>
  <FilterChips v-model="mode" label="範圍" :options="options">
    <!-- 選「自己選」時清單淡入上浮；月份展開時那個月的場次也一樣（rise） -->
    <Transition name="rise">
      <div v-if="mode === 'custom'" :id="id" class="mt-1 flex flex-col gap-2">
        <section v-for="month in months" :key="month.key" class="flex flex-col gap-0.5">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex min-w-0 items-center gap-1 rounded-control px-1 py-0.5 text-left text-meta font-medium text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-primary"
              :aria-expanded="open.has(month.key)"
              :aria-controls="`${id}-${month.key}`"
              @click="toggleMonth(month.key)"
            >
              <UIcon :name="open.has(month.key) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="size-3.5 shrink-0" />
              <span>{{ month.label }}</span>
              <span v-if="!open.has(month.key)" class="font-normal text-dimmed">
                （{{ month.list.length }} 場<template v-if="pickedIn(month.list)">，已選 {{ pickedIn(month.list) }}</template>）
              </span>
            </button>
            <UButton
              v-if="open.has(month.key)"
              :label="pickedIn(month.list) === month.list.length ? '取消全選' : '全選'"
              color="neutral"
              variant="link"
              size="xs"
              class="ml-auto p-0 text-muted hover:text-highlighted"
              :ui="{ label: 'text-meta' }"
              :aria-label="`${month.label}${pickedIn(month.list) === month.list.length ? '取消全選' : '全選'}`"
              @click="toggleAll(month.list)"
            />
          </div>
          <Transition name="rise">
            <div v-show="open.has(month.key)" :id="`${id}-${month.key}`" role="group" :aria-label="month.label" class="flex flex-col gap-0.5">
              <button
                v-for="s in month.list"
                :key="s.slug"
                type="button"
                role="checkbox"
                :aria-checked="picked.has(s.slug)"
                class="flex w-full items-center gap-2 rounded-control px-2 py-1 text-left text-ui transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                :class="picked.has(s.slug)
                  ? 'bg-inverted font-medium text-inverted'
                  : ['text-toned hover:bg-accented hover:text-highlighted', { 'opacity-70': s.upcoming }]"
                @click="toggle(s.slug)"
              >
                <span
                  class="flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border"
                  :class="picked.has(s.slug) ? 'border-current' : 'border-accented'"
                  aria-hidden="true"
                >
                  <UIcon v-if="picked.has(s.slug)" name="i-lucide-check" class="size-3" />
                </span>
                <span class="w-11 shrink-0 font-mono text-meta" :class="picked.has(s.slug) ? '' : 'text-muted'">{{ splitDate(s.chip)[0] }}</span>
                <span class="min-w-0 truncate">{{ splitDate(s.chip)[1] }}</span>
              </button>
            </div>
          </Transition>
        </section>
      </div>
    </Transition>
  </FilterChips>
</template>
