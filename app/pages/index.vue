<script setup lang="ts">
import consola from 'consola'

const router = useRouter()
const shortCode = ref('')
const huntName = ref('')
const newHuntDisabled = ref(false)
const handleGoToHuntSubmit = () => {
  if (shortCode.value.trim()) {
    router.push(`/hunts/${shortCode.value.trim()}`)
  }
}

const handleCreateHuntSubmit = async () => {
  if (huntName.value.trim()) {
    newHuntDisabled.value = true
    const {data, error} = await useHuntsApi().create(huntName.value.trim())
    if (data.value) {
      
      router.push(`/hunts/${data.value.shortCode}`)
      newHuntDisabled.value = false
    }
    if (error.value) {
      consola.error(error.value)
    }
  
  }
}
</script>

<template>
  <div class="flex  items-center justify-center p-4">
    <div class="w-full max-w-md ">
      <div class="space-y-4">
        <form @submit.prevent="handleGoToHuntSubmit" class="space-y-4">
          <div class="space-y-2">
            <Input
              v-model="shortCode"
              placeholder="floppy-seals-argue"
              class="w-full"
            />
          </div>
          <Button type="submit" class="w-full">
            Go to hunt
          </Button>
        </form>
        
        <div class="relative my-12">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <form @submit.prevent="handleCreateHuntSubmit" class="space-y-4">
          <div class="space-y-2">
            <Input
              v-model="huntName"
              placeholder="My scavenger hunt"
              class="w-full"
            />
          </div>
          <Button :disabled="newHuntDisabled" type="submit" class="w-full">
            Create a new hunt
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
