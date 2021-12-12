<template>
  <div id="app">
    <ul>
      <li class="menuItem">
        <router-link to="/" class="menu--link"> Pokemon</router-link>
      </li>
      <li class="menuItem">
        <router-link to="/threejs" class="menu--link"> threejs</router-link>
      </li>
      <li class="menuItem">
        <router-link to="/threejs2" class="menu--link"> threejs2</router-link>
      </li>
      <li class="menuItem">
        <router-link to="/exo" class="menu--link"> Exo</router-link>
      </li>
    </ul>
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App"
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.menuItem {
  list-style: none; /* enlever les puces */
  margin: 0; /* enlever les marges automatiques */
  padding-right: 10px;
  display: table-cell; /* affichage en ligne */
}
</style>
