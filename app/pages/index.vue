<script setup lang="ts">
// 首頁直接顯示最新一場
import { latestSession } from '~/data/sessions'

const session = latestSession()
useSeoMeta({ title: `悅讀聊天室・${session.chip}`, ogTitle: '悅讀聊天室', ogDescription: `這週：${session.title}` })
</script>

<template>
  <SessionView :session="session" />
</template>
