<template>
  <div class="flex flex-col min-h-screen">
    <!-- <LayoutNavbar /> -->

    <main class="container mx-auto px-4 py-8 flex-grow">
      <div class="max-w-6xl mx-auto space-y-6">
        <slot />
      </div>
    </main>
    <LayoutFooter />
  </div>
</template>
