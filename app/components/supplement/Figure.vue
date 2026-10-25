<script setup lang="ts">
// 依 key 顯示只適用某一本書的示意圖（SPEC.md 5.6、DESIGN.md 6.9）。新增圖時在 lib/schema.ts 的 figure 和這裡各加一個。
import type { SupplementFigureKey } from '~/types/session'

defineProps<{ figure: SupplementFigureKey }>()
</script>

<template>
  <SupplementIvanSlope v-if="figure === 'ivan-slope'" />
  <SupplementIvanTrain v-else-if="figure === 'ivan-train'" />
  <SupplementIvanSyllogism v-else-if="figure === 'ivan-syllogism'" />
  <SupplementIvanPeople v-else-if="figure === 'ivan-people'" />
  <SupplementIvanSack v-else />
</template>
