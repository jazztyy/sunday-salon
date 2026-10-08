<script setup lang="ts">
// 論證卡片（預測試）：先猜哪個前提最站不住，再揭曉 Kagan 的判斷。規格見 SPEC.md 4.2、DESIGN.md「學習互動」。
// 猜題紀錄存在 salon-arg-{slug}（useArgPicks，依論證 key 記前提索引），-1 表示「直接看答案」。
import type { Argument, Session } from '~/types/session'

const props = defineProps<{ arg: Argument, session: Pick<Session, 'slug' | 'args'> }>()

const { pickOf, save: savePick } = useArgPicks(props.session.slug, () => props.session.args)
const open = ref(false)

const pick = computed<number | undefined>(() => pickOf(props.arg))
const done = computed(() => pick.value !== undefined)

/** 使用者選的前提是否正好是 Kagan 質疑的；直接看答案（-1）時為 null，不顯示回饋 */
const hit = computed<boolean | null>(() => {
  if (pick.value === undefined || pick.value === -1) return null
  return !!props.arg.prem[pick.value]?.[1]
})

/** 剛剛點了前提：點的按鈕換成結果、焦點會掉，揭曉出現後把焦點交給結果（掛載時讀回的紀錄不動焦點） */
let picked = false
const save = (value: number | undefined) => {
  picked = value !== undefined && value !== -1
  savePick(props.arg, value)
}
const onRevealed = (el: Element) => {
  if (picked) focusIfLost(el as HTMLElement)
  picked = false
}

const premClass = (j: number, weak: boolean) => {
  const base = 'grid w-full grid-cols-[2.4em_1fr] items-start gap-2 rounded-control border px-2.5 py-2 text-left transition-colors'
  const border = pick.value === j ? 'border-primary' : 'border-transparent'
  if (!done.value) {
    return [base, border, 'cursor-pointer bg-accented hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary']
  }
  return [base, border, weak ? 'bg-error-soft' : 'bg-success-soft']
}

const numClass = (weak: boolean) => {
  if (!done.value) return 'text-muted'
  return weak ? 'text-error' : 'text-success'
}

/** 「質疑」「接受」徽章：框線跟著文字色（DESIGN.md「判斷徽章」） */
const badgeClass = 'mr-1.5 rounded-tag px-1.5 py-0 align-baseline text-meta leading-normal font-bold ring-current'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
</script>

<template>
  <UCollapsible v-model:open="open" class="rounded-card border border-default bg-elevated">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-3 rounded-card px-3.5 py-3 text-left transition-colors hover:bg-accented"
      :class="focusRing"
    >
      <span class="flex min-w-0 flex-col">
        <span class="font-mono text-meta font-medium text-muted">{{ arg.kind }} · {{ arg.ts }}</span>
        <span class="font-bold">{{ arg.name }}</span>
      </span>
      <span class="ml-auto flex-none text-meta font-medium" :class="done ? 'text-success' : 'text-muted'">
        {{ done ? '已作答' : '未作答' }}
      </span>
      <span aria-hidden="true" class="flex-none font-mono text-title font-medium text-muted">{{ open ? '−' : '+' }}</span>
    </button>

    <template #content>
      <div class="flex flex-col gap-3 px-3.5 pb-3.5">
        <p v-if="!done" class="text-small text-toned">
          <b class="text-primary">先猜猜看：</b>你覺得哪一個前提最站不住？點一下選它。
        </p>

        <ol class="flex flex-col gap-2">
          <li v-for="([text, objection, accept], j) in arg.prem" :key="j">
            <button
              v-if="!done"
              type="button"
              :class="premClass(j, !!objection)"
              @click="save(j)"
            >
              <span class="pt-0.5 font-mono text-ui font-medium" :class="numClass(!!objection)">P{{ j + 1 }}</span>
              <span>{{ text }}</span>
            </button>
            <div v-else :class="premClass(j, !!objection)">
              <span class="pt-0.5 font-mono text-ui font-medium" :class="numClass(!!objection)">
                P{{ j + 1 }}
              </span>
              <div>
                {{ text }}
                <div v-if="objection" class="mt-1.5 text-small leading-relaxed text-error">
                  <UBadge variant="outline" color="error" label="質疑" :class="badgeClass" />{{ objection }}
                </div>
                <div v-if="accept" class="mt-1.5 text-small leading-relaxed text-success">
                  <UBadge variant="outline" color="success" label="接受" :class="badgeClass" />{{ accept }}
                </div>
              </div>
            </div>
          </li>
          <li class="grid grid-cols-[2.4em_1fr] items-start gap-2 border-t-2 border-inverted px-2.5 pt-2.5 pb-2">
            <span class="pt-0.5 font-mono text-ui font-medium text-highlighted">∴</span>
            <b>{{ arg.concl }}</b>
          </li>
        </ol>

        <!-- 揭曉：對照結果和 Kagan 的判斷淡入上浮（rise）；質疑、接受的說明跟著前提的底色一起換 -->
        <Transition name="rise" @after-enter="onRevealed">
          <div v-if="done" tabindex="-1" class="flex flex-col gap-3 focus-visible:outline-none">
            <p v-if="hit !== null" class="text-small font-bold" :class="hit ? 'text-success' : 'text-primary'">
              <template v-if="hit">你選了 P{{ (pick ?? 0) + 1 }}，Kagan 也質疑這一步。</template>
              <template v-else>你選了 P{{ (pick ?? 0) + 1 }}，但 Kagan 接受這一步。看看他質疑的是哪裡。</template>
            </p>
            <p class="border-l-3 border-primary pl-3 text-body-sm text-toned">{{ arg.verdict }}</p>
          </div>
        </Transition>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <VideoLink :vid="arg.vid" :t="arg.t" class="text-ui">看這段影片 ▸</VideoLink>
          <UButton
            variant="link"
            color="secondary"
            class="p-0 text-ui underline"
            :label="done ? '重新猜' : '直接看答案'"
            @click="save(done ? undefined : -1)"
          />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
