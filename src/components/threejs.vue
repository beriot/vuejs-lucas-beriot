<template>
  <div>
    <div id="container"></div>
  </div>
</template>

<script>
import * as three from "three";

export default {
  name: "TreeJS",

  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      mesh: null
    };
  },
  methods: {
    init: function() {
      let container = document.getElementById("container");
      let tailleTab = 16;
      this.camera = new three.PerspectiveCamera(
        70,
        container.clientWidth / container.clientHeight,
        0.01,
        20
      );
      this.camera.position.z = 15;
      this.camera.position.x = 0;
      this.camera.position.y = 0;

      this.scene = new three.Scene();

      const geometry = new three.PlaneGeometry(10, 10, 10);
      const terre = new three.MeshBasicMaterial({
        color: 0x32cd32,
        side: three.DoubleSide
      });
      this.mesh = new three.Mesh(geometry, terre);
      this.scene.add(this.mesh);
      this.mesh.position.x = 0;
      this.mesh.position.y = 0;
      this.renderer = new three.WebGLRenderer({ antialias: true });
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(this.renderer.domElement);
    },
    animate: function() {
      requestAnimationFrame(this.animate);
      this.mesh.rotation.x += 0.01;
      this.mesh.rotation.y += 0.02;
      this.renderer.render(this.scene, this.camera);
    }
  },
  mounted() {
    /*const container = document.querySelector('#scene-container');
        const fov = 70;
        const aspect = container.clientWidth / container.clientHeight;
        const near = 0.1;
        const far = 100;
        this.camera = new three.PerspectiveCamera(fov, aspect, near, far);
        this.scene = new three.Scene();
        this.camera.position.set(0, 0, 15);
        const geometry = new three.BoxBufferGeometry(2, 2, 2);
        const material = new three.MeshBasicMaterial()
        const cube = new three.Mesh(geometry, material);
        this.scene.add(cube);
        const geometrye = new three.PlaneGeometry( 1, 1 );
        const terre = new three.MeshBasicMaterial( {color: 0x32CD32, side: three.DoubleSide} );
        const mech = new three.Mesh( geometrye, terre )
        this.scene.add(mech)



        this.renderer = new three.WebGLRenderer();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.append(this.renderer.domElement);
        this.renderer.render(this.scene, this.camera);*/
    this.init();
    this.animate();
  }
};
</script>

<style>
#scene-container {
  width: 60%;
  height: 60%;
  background-color: skyblue;
}
#container {
  width: 1000px;
  height: 700px;
  margin-left: auto;
  margin-right: auto;
}
</style>
