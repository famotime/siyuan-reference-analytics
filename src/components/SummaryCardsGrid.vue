<template>
  <div class="summary-grid">
    <article
      v-for="card in cards"
      :key="card.key"
      :class="[
        'summary-card',
        'summary-card--interactive',
        {
          'summary-card--active': card.key === selectedSummaryCardKey,
          'summary-card--dragging': card.key === draggedSummaryCardKey,
          'summary-card--drop-target': card.key === dropTargetSummaryCardKey && card.key !== draggedSummaryCardKey,
        },
      ]"
      :title="card.hint"
      draggable="true"
      @dragstart="handleSummaryCardDragStart(card.key, $event)"
      @dragover.prevent="handleSummaryCardDragOver(card.key, $event)"
      @drop.prevent="handleSummaryCardDrop(card.key)"
      @dragend="handleSummaryCardDragEnd"
    >
      <div class="summary-card__frame">
        <button
          class="summary-card__main"
          type="button"
          @click="onSelectSummaryCard(card.key)"
        >
          <span class="summary-card__label">{{ card.label }}</span>
          <strong class="summary-card__value">{{ card.value }}</strong>
        </button>
        <button
          v-if="card.key === 'read'"
          class="summary-card__toggle"
          type="button"
          :aria-label="readCardMode === 'read' ? '切换为未读文档' : '切换为已读文档'"
          :title="readCardMode === 'read' ? '切换为未读文档' : '切换为已读文档'"
          @click.stop="onToggleReadCardMode()"
        >
          <svg
            class="summary-card__toggle-icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path
              d="M3 5h8.5M9.5 2.5 12 5l-2.5 2.5M13 11H4.5M6.5 8.5 4 11l2.5 2.5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.4"
            />
          </svg>
        </button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { ReadCardMode } from '@/analytics/read-status'
import type { SummaryCardItem, SummaryCardKey } from '@/analytics/summary-details'

const props = defineProps<{
  cards: SummaryCardItem[]
  selectedSummaryCardKey: SummaryCardKey
  readCardMode: ReadCardMode
  onSelectSummaryCard: (cardKey: SummaryCardKey) => void
  onToggleReadCardMode: () => void
  onReorderSummaryCard: (draggedKey: SummaryCardKey, targetKey: SummaryCardKey) => void
}>()

const draggedSummaryCardKey = ref<SummaryCardKey | ''>('')
const dropTargetSummaryCardKey = ref<SummaryCardKey | ''>('')

function handleSummaryCardDragStart(cardKey: SummaryCardKey, event: DragEvent) {
  draggedSummaryCardKey.value = cardKey
  dropTargetSummaryCardKey.value = ''
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', cardKey)
  }
}

function handleSummaryCardDragOver(cardKey: SummaryCardKey, event: DragEvent) {
  if (!draggedSummaryCardKey.value || draggedSummaryCardKey.value === cardKey) {
    return
  }
  dropTargetSummaryCardKey.value = cardKey
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleSummaryCardDrop(cardKey: SummaryCardKey) {
  if (!draggedSummaryCardKey.value) {
    return
  }
  props.onReorderSummaryCard(draggedSummaryCardKey.value, cardKey)
  draggedSummaryCardKey.value = ''
  dropTargetSummaryCardKey.value = ''
}

function handleSummaryCardDragEnd() {
  draggedSummaryCardKey.value = ''
  dropTargetSummaryCardKey.value = ''
}
</script>

<style scoped>
.summary-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  align-items: stretch;
  margin-bottom: 24px;
}

.summary-card {
  padding: 10px;
  min-width: 0;
  height: 100%;
  text-align: left;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid var(--panel-border);
  background: var(--surface-card-strong);
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08);
}

.summary-card--interactive {
  width: 100%;
  cursor: grab;
  color: inherit;
}

.summary-card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.12);
  border-color: color-mix(in srgb, var(--b3-theme-primary) 20%, transparent);
}

.summary-card--dragging {
  opacity: 0.6;
  cursor: grabbing;
}

.summary-card--drop-target {
  border-color: color-mix(in srgb, var(--accent-warm) 45%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-warm) 18%, transparent);
}

.summary-card--active {
  border-color: color-mix(in srgb, var(--accent-cool) 40%, transparent);
  background: color-mix(in srgb, var(--accent-cool) 5%, var(--b3-theme-surface));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-cool) 10%, transparent);
}

.summary-card__label {
  font-size: 13px;
  color: var(--panel-muted);
  font-weight: 500;
}

.summary-card__frame {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.summary-card__main {
  flex: 1;
  min-width: 0;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  font: inherit;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card__toggle {
  flex: none;
  width: 20px;
  height: 20px;
  border: 1px solid color-mix(in srgb, var(--b3-theme-primary) 16%, transparent);
  border-radius: 999px;
  padding: 0;
  background: color-mix(in srgb, var(--b3-theme-primary) 6%, var(--surface-card));
  color: var(--panel-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}

.summary-card__toggle:hover {
  color: var(--b3-theme-primary);
  border-color: color-mix(in srgb, var(--b3-theme-primary) 30%, transparent);
  background: color-mix(in srgb, var(--b3-theme-primary) 12%, var(--surface-card));
  transform: rotate(18deg);
}

.summary-card__toggle-icon {
  width: 10px;
  height: 10px;
}

.summary-card__value {
  font-size: 32px;
  line-height: 1;
  font-weight: 600;
  color: var(--b3-theme-primary);
}
</style>
