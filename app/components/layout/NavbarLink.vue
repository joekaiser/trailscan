<template>
  <NuxtLink
    v-bind="$attrs"
    class="px-3 py-1 hover:text-primary inline-flex items-center text-sm link"
    active-class="active"
  >
    <slot />
  </NuxtLink>
</template>

<style lang="scss" scoped>
.link {
  box-sizing: border-box;
  border-bottom: 2px solid transparent;
  transition: border-color 0.1s ease;

  // &.active {
  //   border-color: var(--secondary);
  // }

  // &:hover:not(.active) {
  //   border-bottom-color: color-mix(in srgb, var(--primary) 20%, transparent);
  // }
}
</style>
