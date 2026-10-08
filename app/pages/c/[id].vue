<script setup lang="ts">
// /c/{id} 單張概念卡（直接打開網址或分享時用）。站內點概念卡會開彈窗，不會進到這一頁（見 app.vue）。
// 內容在 <ConceptDetail>，和彈窗共用。
const route = useRoute()
const id = String(route.params.id)

const { data: concepts } = await useAllConcepts()
const concept = computed(() => concepts.value.find(c => c.id === id))
if (!concept.value) throw createError({ statusCode: 404, statusMessage: '找不到這張概念卡', fatal: true })

useSeoMeta({
  title: () => `${concept.value?.title ?? ''}・概念卡・悅讀聊天室`,
  description: () => concept.value?.summary ?? '',
})
</script>

<template>
  <div>
    <SalonHeader />
    <main class="mx-auto max-w-[1080px] px-4 pt-7 pb-16">
      <div class="overflow-hidden rounded-card border border-default">
        <ConceptDetail :id="id" />
      </div>
    </main>
  </div>
</template>
