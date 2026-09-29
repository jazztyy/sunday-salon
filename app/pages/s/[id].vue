<script setup lang="ts">
// 各場次的固定網址：/s/w1
import { findSession } from '~/data/sessions'

const route = useRoute()
const session = findSession(String(route.params.id))
if (!session) throw createError({ statusCode: 404, statusMessage: '找不到這一場' })

useSeoMeta({ title: `悅讀聊天室・${session.chip}`, ogTitle: '悅讀聊天室', ogDescription: session.title })
</script>

<template>
  <SessionView v-if="session" :session="session" />
</template>
