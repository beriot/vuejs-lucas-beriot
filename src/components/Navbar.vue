<template>
  <div class="bg-teal-700 p-2 text-center">
    <a
      v-for="(link, index) in navigation"
      :key="index"
      href="#"
      @click="selectComponent(link.component)"
    >
      {{ link.name }}
    </a>
  </div>
</template>

<script>
export default {
  name: "NavBar",
  data() {
    return {
      navigation: [
        { name: "Pokemon | ", component: "hello-world" },
        { name: "Exo | ", component: "" },
        { name: "ThreeJS", component: "threejs" }
      ]
    };
  },
  methods: {
    selectComponent(comp) {
      this.$emit("change-component", comp);
    }
  }
};
</script>

<style scoped></style>
