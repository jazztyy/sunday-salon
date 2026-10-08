<script setup lang="ts">
// 全站共用的概念卡彈窗（掛在 app.vue）。內容是 <ConceptDetail>（左欄概念、右欄筆記）。
// 彈窗裡點別的概念卡會直接換內容並捲回頂端；點場次或 tag 會換頁，換頁時自動關閉。
const { id, close } = useConceptModal()
const { data: concepts } = await useAllConcepts()

const concept = computed(() => concepts.value.find(c => c.id === id.value))

const open = computed({
  get: () => !!id.value && !!concept.value,
  set: (v: boolean) => { if (!v) close() },
})

const route = useRoute()
watch(() => route.fullPath, close)

const body = useTemplateRef<HTMLElement>('body')
watch(id, () => nextTick(() => body.value?.closest('[data-slot="body"]')?.scrollTo({ top: 0 })))
</script>

<template>
  <UModal
    v-model:open="open"
    :title="concept?.title ?? '概念卡'"
    :close="false"
    :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
    :ui="{ content: 'sm:max-w-5xl', header: 'sr-only', body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <div ref="body" class="relative">
        <UButton
          icon="i-lucide-x"
          aria-label="關閉"
          color="neutral"
          variant="ghost"
          size="sm"
          class="absolute top-3 right-3 z-10"
          @click="close"
        />
        <ConceptDetail v-if="id" :id="id" />
      </div>
    </template>
  </UModal>
</template>
