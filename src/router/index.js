import exo from "@/components/exo";
import HelloWorld from "@/components/HelloWorld";
import threejs from "@/components/threejs";
import threejspyra from "@/components/threejspyra";
import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "HelloWorld",
      component: HelloWorld
    },
    {
      path: "/threejs",
      name: "TreeJS",
      component: threejs
    },
    {
      path: "/threejs2",
      name: "TreeJS2",
      component: threejspyra
    },

    {
      path: "/exo",
      name: "exo",
      component: exo
    }
  ]
});
