<script setup lang="ts">
// 「邊看邊想」分頁：論證地圖。規格見 SPEC.md 4.2。
import type { Session } from '~/types/session'

defineProps<{ session: Session }>()
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">論證地圖</h2>
    <p class="text-small text-muted">看到某個論證時打開它的卡片。每張卡片把論證拆成前提和結論：先自己判斷哪一步最可疑，再看 Kagan 的判斷。紅色是他質疑的，綠色是他接受的。</p>
    <WhyNote>先猜再看答案（預測試）：就算猜錯，也比直接讀答案記得更牢。</WhyNote>
    <p v-if="session.argsNote" class="text-small text-muted">{{ session.argsNote }}</p>
    <div class="flex flex-col gap-3">
      <ArgumentCard
        v-for="(arg, i) in session.args"
        :key="`${session.id}-${i}`"
        :arg="arg"
        :index="i"
        :session-id="session.id"
      />
    </div>
  </section>
</template>
