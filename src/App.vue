<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <section class="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 class="text-base font-semibold text-fg">Projekt eingerichtet</h2>
        <p class="mt-1 text-sm text-muted">
          Als Nächstes: Adresse suchen, Grundstück einzeichnen, Umgebung prüfen.
        </p>
      </section>
    </main>
  </div>
</template>
