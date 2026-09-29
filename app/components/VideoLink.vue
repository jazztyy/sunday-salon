<script setup lang="ts">
// 所有指向影片的連結都要用這個元件（DESIGN.md「影片」）。
// 有內嵌播放器時：攔截點擊，改成讓播放器跳到該段。
// 沒有播放器時（API 載入失敗）：照常開新分頁到 YouTube。
const props = withDefaults(defineProps<{ vid: string, t?: number }>(), { t: 0 })
const emit = defineEmits<{ played: [] }>()

const { embed, play } = usePlayer()

const href = computed(() => `https://www.youtube.com/watch?v=${props.vid}${props.t ? `&t=${props.t}s` : ''}`)

const onClick = (e: MouseEvent) => {
  if (!embed.value) return
  e.preventDefault()
  play(props.vid, props.t)
  emit('played')
}
</script>

<template>
  <a :href="href" target="_blank" rel="noopener" class="text-secondary underline-offset-2 hover:underline" @click="onClick"><slot /></a>
</template>
