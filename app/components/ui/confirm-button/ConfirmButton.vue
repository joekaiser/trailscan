<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { onUnmounted, ref } from "vue";

import type { ButtonVariants } from "../button";

const props = withDefaults(defineProps<Props>(), {
  as: "button",
  timeout: 2300,
  confirmVariant: "destructive",
  variant: "default",
  size: "default",
  confirmText: "Confirm?",
});
const emit = defineEmits<{
  (e: "confirm"): void;
}>();
type Props = {
  variant?: ButtonVariants["variant"];
  confirmVariant?: ButtonVariants["variant"];
  timeout?: number;
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  confirmText?: string;
} & PrimitiveProps;

const isConfirming = ref(false);

let timer: number;
const timeClicked = ref(0);
function handleClick() {
  if (isConfirming.value) {
    if (Date.now() - timeClicked.value < 400) { // prevent double click
      return;
    }
    emit("confirm");
    reset();
  }
  else {
    timeClicked.value = Date.now();
    isConfirming.value = true;

    timer = window.setTimeout(() => {
      reset();
    }, props.timeout);
  }
}

function reset() {
  isConfirming.value = false;
  timeClicked.value = 0;
  if (timer) {
    clearTimeout(timer);
  }
}

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
  }
});
</script>

<template>
  <Button
    :variant="isConfirming ? confirmVariant : variant"
    :size="props.size"
    :class="props.class"
    @click.stop="handleClick"
  >
    <transition name="fade" mode="out-in">
      <span v-if="!isConfirming" key="normal"><slot /></span>
      <span
        v-else
        key="confirm"
        aria-live="polite"
      >{{ confirmText }}</span>
    </transition>
  </Button>
</template>
