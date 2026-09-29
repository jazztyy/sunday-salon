<script setup lang="ts">
// 「週日討論」分頁：進行方式、立場題、討論題。規格見 SPEC.md 4.4。
import type { Session } from '~/types/session'

defineProps<{ session: Session }>()
</script>

<template>
  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">週日怎麼進行</h2>
    <ol class="flex flex-col gap-2 text-body-sm">
      <li class="grid grid-cols-[1.8em_1fr] gap-2">
        <span class="pt-0.5 font-mono text-ui font-medium text-secondary">1</span>
        <span>每個人先<b>自己</b>選下面三題的立場，不要先討論。</span>
      </li>
      <li class="grid grid-cols-[1.8em_1fr] gap-2">
        <span class="pt-0.5 font-mono text-ui font-medium text-secondary">2</span>
        <span>主持人看大家的分布。意見很分散時（大約三到七成選同一邊），就找立場不同的人，互相說服兩三分鐘。</span>
      </li>
      <li class="grid grid-cols-[1.8em_1fr] gap-2">
        <span class="pt-0.5 font-mono text-ui font-medium text-secondary">3</span>
        <span>大家再選一次，聊聊誰改變了立場、是被哪個理由說動的。</span>
      </li>
      <li class="grid grid-cols-[1.8em_1fr] gap-2">
        <span class="pt-0.5 font-mono text-ui font-medium text-secondary">4</span>
        <span>剩下的時間，從下面的討論題挑有感覺的聊。</span>
      </li>
    </ol>
    <WhyNote>同儕教學（Mazur）：先獨立作答、再和意見不同的人互相說服，比聽講更能看清自己的盲點。</WhyNote>
  </section>

  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">立場題</h2>
    <p class="text-small text-muted">你的選擇只存在自己的瀏覽器，別人看不到。活動前選「討論前」，活動後再選「討論後」。</p>
    <div class="flex flex-col gap-3.5">
      <SundayVote v-for="(v, i) in session.votes" :key="`${session.id}-${i}`" :vote="v" :index="i" :session-id="session.id" />
    </div>
  </section>

  <section class="flex flex-col gap-4">
    <h2 class="font-serif text-h2 font-black leading-snug text-highlighted">討論題</h2>
    <p class="text-small text-muted">不用每題都想好答案，挑一兩題有感覺的帶來就好。標「延伸」的題目超出影片內容。</p>
    <SundayDiscuss :items="session.discuss" />
  </section>
</template>
