<script setup lang="ts">
// 全站共用的確認彈窗（掛在 app.vue，由 useConfirm() 打開）。外觀和筆記彈窗一致：深色卡片、襯線標題、右下兩個按鈕。
// 打開時不自動聚焦任何按鈕（不會出現焦點框，按 Enter 也不會誤刪）。點外面、按 Esc 都算取消。
const { request, answer } = useConfirm()

const open = computed({
  get: () => !!request.value,
  set: (v: boolean) => { if (!v) answer(false) },
})

const noAutoFocus = (e: Event) => e.preventDefault()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="request?.title ?? ''"
    :close="false"
    :content="{ onOpenAutoFocus: noAutoFocus }"
    :ui="{ content: 'sm:max-w-md', header: 'sr-only', body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <div v-if="request" class="flex flex-col gap-5 p-6">
        <div class="flex flex-col gap-2">
          <h2 class="font-serif text-title leading-snug font-black text-highlighted">{{ request.title }}</h2>
          <p v-if="request.description" class="text-small leading-relaxed text-muted">{{ request.description }}</p>
        </div>
        <div class="flex justify-end gap-2">
          <UButton
            :label="request.cancelLabel ?? '取消'"
            color="neutral"
            variant="ghost"
            class="rounded-control px-4 text-ui font-medium"
            @click="answer(false)"
          />
          <UButton
            :label="request.confirmLabel ?? '確定'"
            color="neutral"
            variant="solid"
            class="rounded-control px-4 text-ui font-medium"
            @click="answer(true)"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
