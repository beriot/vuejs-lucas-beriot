<template>
  <div class="template">
    <img
      class="pokeimg"
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/International_Pok%C3%A9mon_logo.svg/1200px-International_Pok%C3%A9mon_logo.svg.png"
    />
    <div class="pokedex">
      <label class="labelrecherche">Recherche</label>
      <input class="recherche" type="number" v-on:change="recherchepk" />
      <div id="card">
        <p>Nom : {{ this.namepk }} {{ this.idpk }}</p>
        <ul>
          <li v-for="value in this.typepk" v-bind:key="value">
            Type : {{ value.type.name }}
          </li>
        </ul>
        <img id="source" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "hello",
  data() {
    return {
      basepk: 1,
      namepk: null,
      imagepk: null,
      typepk: null,
      idpk: null
    };
  },
  methods: {
    recherchepk: function(event) {
      var url = "https://pokeapi.co/api/v2/pokemon/" + event.target.value;
      console.log(url);
      axios.get(url).then(response => {
        this.namepk = response.data.name;
        this.idpk = response.data.id;
        this.imagepk = response.data.sprites.front_shiny;
        this.typepk = response.data.types;
        document.getElementById("source").src = this.imagepk;
      });
    }
  },
  mounted() {}
};
</script>

<style scoped>
input[type="number"] {
  width: 60%;
  padding: 12px 20px;
  margin: 8px 0;
  box-sizing: border-box;
  border-radius: 20px;
}
.pokedex {
  color: white;
  background-color: grey;
  width: 50%;
  height: 260px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  border-radius: 20px;
  text-align: center;
  font-size: 18px;
}
#card {
  font-size: 18px;
  color: white;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pokeimg {
  max-width: 30%;
}
</style>
