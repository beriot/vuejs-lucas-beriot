// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import * as THREE from "../public/three/three";
import App from "./App";
import router from "./router";

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: "#app",
  router,
  components: { App },
  template: "<App/>"
});

//// THREE /////

THREE.OBJLoader = function(manager) {
  this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;

  this.materials = null;
};

THREE.OBJLoader.prototype = {
  constructor: THREE.OBJLoader,

  load: function(url, onLoad, onProgress, onError) {
    var scope = this;

    var loader = new THREE.FileLoader(scope.manager);
    loader.setPath(this.path);
    loader.load(
      url,
      function(text) {
        onLoad(scope.parse(text));
      },
      onProgress,
      onError
    );
  },

  setPath: function(value) {
    this.path = value;
  },

  setMaterials: function(materials) {
    this.materials = materials;
  },

  _createParserState: function() {
    var state = {
      objects: [],
      object: {},

      vertices: [],
      normals: [],
      uvs: [],

      materialLibraries: [],

      startObject: function(name, fromDeclaration) {
        // If the current object (initial from reset) is not from a g/o declaration in the parsed
        // file. We need to use it for the first parsed g/o to keep things in sync.
        if (this.object && this.object.fromDeclaration === false) {
          this.object.name = name;
          this.object.fromDeclaration = fromDeclaration !== false;
          return;
        }

        var previousMaterial =
          this.object && typeof this.object.currentMaterial === "function"
            ? this.object.currentMaterial()
            : undefined;

        if (this.object && typeof this.object._finalize === "function") {
          this.object._finalize(true);
        }

        this.object = {
          name: name || "",
          fromDeclaration: fromDeclaration !== false,

          geometry: {
            vertices: [],
            normals: [],
            uvs: []
          },
          materials: [],
          smooth: true,

          startMaterial: function(name, libraries) {
            var previous = this._finalize(false);

            // New usemtl declaration overwrites an inherited material, except if faces were declared
            // after the material, then it must be preserved for proper MultiMaterial continuation.
            if (previous && (previous.inherited || previous.groupCount <= 0)) {
              this.materials.splice(previous.index, 1);
            }

            var material = {
              index: this.materials.length,
              name: name || "",
              mtllib:
                Array.isArray(libraries) && libraries.length > 0
                  ? libraries[libraries.length - 1]
                  : "",
              smooth: previous !== undefined ? previous.smooth : this.smooth,
              groupStart: previous !== undefined ? previous.groupEnd : 0,
              groupEnd: -1,
              groupCount: -1,
              inherited: false,

              clone: function(index) {
                var cloned = {
                  index: typeof index === "number" ? index : this.index,
                  name: this.name,
                  mtllib: this.mtllib,
                  smooth: this.smooth,
                  groupStart: 0,
                  groupEnd: -1,
                  groupCount: -1,
                  inherited: false
                };
                cloned.clone = this.clone.bind(cloned);
                return cloned;
              }
            };

            this.materials.push(material);

            return material;
          },

          currentMaterial: function() {
            if (this.materials.length > 0) {
              return this.materials[this.materials.length - 1];
            }

            return undefined;
          },

          _finalize: function(end) {
            var lastMultiMaterial = this.currentMaterial();
            if (lastMultiMaterial && lastMultiMaterial.groupEnd === -1) {
              lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
              lastMultiMaterial.groupCount =
                lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
              lastMultiMaterial.inherited = false;
            }

            // Ignore objects tail materials if no face declarations followed them before a new o/g started.
            if (end && this.materials.length > 1) {
              for (var mi = this.materials.length - 1; mi >= 0; mi--) {
                if (this.materials[mi].groupCount <= 0) {
                  this.materials.splice(mi, 1);
                }
              }
            }

            // Guarantee at least one empty material, this makes the creation later more straight forward.
            if (end && this.materials.length === 0) {
              this.materials.push({
                name: "",
                smooth: this.smooth
              });
            }

            return lastMultiMaterial;
          }
        };

        // Inherit previous objects material.
        // Spec tells us that a declared material must be set to all objects until a new material is declared.
        // If a usemtl declaration is encountered while this new object is being parsed, it will
        // overwrite the inherited material. Exception being that there was already face declarations
        // to the inherited material, then it will be preserved for proper MultiMaterial continuation.

        if (
          previousMaterial &&
          previousMaterial.name &&
          typeof previousMaterial.clone === "function"
        ) {
          var declared = previousMaterial.clone(0);
          declared.inherited = true;
          this.object.materials.push(declared);
        }

        this.objects.push(this.object);
      },

      finalize: function() {
        if (this.object && typeof this.object._finalize === "function") {
          this.object._finalize(true);
        }
      },

      parseVertexIndex: function(value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
      },

      parseNormalIndex: function(value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
      },

      parseUVIndex: function(value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 2) * 2;
      },

      addVertex: function(a, b, c) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;

        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
        dst.push(src[b + 0]);
        dst.push(src[b + 1]);
        dst.push(src[b + 2]);
        dst.push(src[c + 0]);
        dst.push(src[c + 1]);
        dst.push(src[c + 2]);
      },

      addVertexLine: function(a) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;

        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
      },

      addNormal: function(a, b, c) {
        var src = this.normals;
        var dst = this.object.geometry.normals;

        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[a + 2]);
        dst.push(src[b + 0]);
        dst.push(src[b + 1]);
        dst.push(src[b + 2]);
        dst.push(src[c + 0]);
        dst.push(src[c + 1]);
        dst.push(src[c + 2]);
      },

      addUV: function(a, b, c) {
        var src = this.uvs;
        var dst = this.object.geometry.uvs;

        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
        dst.push(src[b + 0]);
        dst.push(src[b + 1]);
        dst.push(src[c + 0]);
        dst.push(src[c + 1]);
      },

      addUVLine: function(a) {
        var src = this.uvs;
        var dst = this.object.geometry.uvs;

        dst.push(src[a + 0]);
        dst.push(src[a + 1]);
      },

      addFace: function(a, b, c, d, ua, ub, uc, ud, na, nb, nc, nd) {
        var vLen = this.vertices.length;

        var ia = this.parseVertexIndex(a, vLen);
        var ib = this.parseVertexIndex(b, vLen);
        var ic = this.parseVertexIndex(c, vLen);
        var id;

        if (d === undefined) {
          this.addVertex(ia, ib, ic);
        } else {
          id = this.parseVertexIndex(d, vLen);

          this.addVertex(ia, ib, id);
          this.addVertex(ib, ic, id);
        }

        if (ua !== undefined) {
          var uvLen = this.uvs.length;

          ia = this.parseUVIndex(ua, uvLen);
          ib = this.parseUVIndex(ub, uvLen);
          ic = this.parseUVIndex(uc, uvLen);

          if (d === undefined) {
            this.addUV(ia, ib, ic);
          } else {
            id = this.parseUVIndex(ud, uvLen);

            this.addUV(ia, ib, id);
            this.addUV(ib, ic, id);
          }
        }

        if (na !== undefined) {
          // Normals are many times the same. If so, skip function call and parseInt.
          var nLen = this.normals.length;
          ia = this.parseNormalIndex(na, nLen);

          ib = na === nb ? ia : this.parseNormalIndex(nb, nLen);
          ic = na === nc ? ia : this.parseNormalIndex(nc, nLen);

          if (d === undefined) {
            this.addNormal(ia, ib, ic);
          } else {
            id = this.parseNormalIndex(nd, nLen);

            this.addNormal(ia, ib, id);
            this.addNormal(ib, ic, id);
          }
        }
      },

      addLineGeometry: function(vertices, uvs) {
        this.object.geometry.type = "Line";

        var vLen = this.vertices.length;
        var uvLen = this.uvs.length;

        for (var vi = 0, l = vertices.length; vi < l; vi++) {
          this.addVertexLine(this.parseVertexIndex(vertices[vi], vLen));
        }

        for (var uvi = 0, ll = uvs.length; uvi < ll; uvi++) {
          this.addUVLine(this.parseUVIndex(uvs[uvi], uvLen));
        }
      }
    };

    state.startObject("", false);

    return state;
  },

  parse: function(text) {
    //console.time( 'OBJLoader' );

    var state = this._createParserState();

    if (text.indexOf("\r\n") !== -1) {
      // This is faster than String.split with regex that splits on both
      text = text.replace(/\r\n/g, "\n");
    }

    if (text.indexOf("\\\n") !== -1) {
      // join lines separated by a line continuation character (\)
      text = text.replace(/\\\n/g, "");
    }

    var lines = text.split("\n");
    var line = "",
      lineFirstChar = "",
      lineSecondChar = "";
    var lineLength = 0;
    var result = [];

    // Faster to just trim left side of the line. Use if available.
    var trimLeft = typeof "".trimLeft === "function";

    for (var i = 0, l = lines.length; i < l; i++) {
      line = lines[i];

      line = trimLeft ? line.trimLeft() : line.trim();

      lineLength = line.length;

      if (lineLength === 0) continue;

      lineFirstChar = line.charAt(0);

      // @todo invoke passed in handler if any
      if (lineFirstChar === "#") continue;

      if (lineFirstChar === "v") {
        lineSecondChar = line.charAt(1);

        if (
          lineSecondChar === " " &&
          (result = this.regexp.vertex_pattern.exec(line)) !== null
        ) {
          // 0                  1      2      3
          // ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

          state.vertices.push(
            parseFloat(result[1]),
            parseFloat(result[2]),
            parseFloat(result[3])
          );
        } else if (
          lineSecondChar === "n" &&
          (result = this.regexp.normal_pattern.exec(line)) !== null
        ) {
          // 0                   1      2      3
          // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

          state.normals.push(
            parseFloat(result[1]),
            parseFloat(result[2]),
            parseFloat(result[3])
          );
        } else if (
          lineSecondChar === "t" &&
          (result = this.regexp.uv_pattern.exec(line)) !== null
        ) {
          // 0               1      2
          // ["vt 0.1 0.2", "0.1", "0.2"]

          state.uvs.push(parseFloat(result[1]), parseFloat(result[2]));
        } else {
          throw new Error("Unexpected vertex/normal/uv line: '" + line + "'");
        }
      } else if (lineFirstChar === "f") {
        if ((result = this.regexp.face_vertex_uv_normal.exec(line)) !== null) {
          // f vertex/uv/normal vertex/uv/normal vertex/uv/normal
          // 0                        1    2    3    4    5    6    7    8    9   10         11         12
          // ["f 1/1/1 2/2/2 3/3/3", "1", "1", "1", "2", "2", "2", "3", "3", "3", undefined, undefined, undefined]

          state.addFace(
            result[1],
            result[4],
            result[7],
            result[10],
            result[2],
            result[5],
            result[8],
            result[11],
            result[3],
            result[6],
            result[9],
            result[12]
          );
        } else if ((result = this.regexp.face_vertex_uv.exec(line)) !== null) {
          // f vertex/uv vertex/uv vertex/uv
          // 0                  1    2    3    4    5    6   7          8
          // ["f 1/1 2/2 3/3", "1", "1", "2", "2", "3", "3", undefined, undefined]

          state.addFace(
            result[1],
            result[3],
            result[5],
            result[7],
            result[2],
            result[4],
            result[6],
            result[8]
          );
        } else if (
          (result = this.regexp.face_vertex_normal.exec(line)) !== null
        ) {
          // f vertex//normal vertex//normal vertex//normal
          // 0                     1    2    3    4    5    6   7          8
          // ["f 1//1 2//2 3//3", "1", "1", "2", "2", "3", "3", undefined, undefined]

          state.addFace(
            result[1],
            result[3],
            result[5],
            result[7],
            undefined,
            undefined,
            undefined,
            undefined,
            result[2],
            result[4],
            result[6],
            result[8]
          );
        } else if ((result = this.regexp.face_vertex.exec(line)) !== null) {
          // f vertex vertex vertex
          // 0            1    2    3   4
          // ["f 1 2 3", "1", "2", "3", undefined]

          state.addFace(result[1], result[2], result[3], result[4]);
        } else {
          throw new Error("Unexpected face line: '" + line + "'");
        }
      } else if (lineFirstChar === "l") {
        var lineParts = line
          .substring(1)
          .trim()
          .split(" ");
        var lineVertices = [],
          lineUVs = [];

        if (line.indexOf("/") === -1) {
          lineVertices = lineParts;
        } else {
          for (var li = 0, llen = lineParts.length; li < llen; li++) {
            var parts = lineParts[li].split("/");

            if (parts[0] !== "") lineVertices.push(parts[0]);
            if (parts[1] !== "") lineUVs.push(parts[1]);
          }
        }
        state.addLineGeometry(lineVertices, lineUVs);
      } else {
        // Handle null terminated files without exception
        if (line === "\0") continue;
      }
    }

    state.finalize();

    var container = new THREE.Group();
    container.materialLibraries = [].concat(state.materialLibraries);

    for (var i2 = 0, l2 = state.objects.length; i2 < l2; i2++) {
      var object = state.objects[i];
      var geometry = object.geometry;
      var materials = object.materials;
      var isLine = geometry.type === "Line";

      // Skip o/g line declarations that did not follow with any faces
      if (geometry.vertices.length === 0) continue;

      var buffergeometry = new THREE.BufferGeometry();

      buffergeometry.addAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(geometry.vertices), 3)
      );

      if (geometry.normals.length > 0) {
        buffergeometry.addAttribute(
          "normal",
          new THREE.BufferAttribute(new Float32Array(geometry.normals), 3)
        );
      } else {
        buffergeometry.computeVertexNormals();
      }

      if (geometry.uvs.length > 0) {
        buffergeometry.addAttribute(
          "uv",
          new THREE.BufferAttribute(new Float32Array(geometry.uvs), 2)
        );
      }

      // Create materials

      var createdMaterials = [];

      for (var mi = 0, miLen = materials.length; mi < miLen; mi++) {
        var sourceMaterial = materials[mi];
        let material = undefined;

        if (this.materials !== null) {
          material = this.materials.create(sourceMaterial.name);

          // mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.
          if (
            isLine &&
            material &&
            !(material instanceof THREE.LineBasicMaterial)
          ) {
            var materialLine = new THREE.LineBasicMaterial();
            materialLine.copy(material);
            material = materialLine;
          }
        }

        if (!material) {
          material = !isLine
            ? new THREE.MeshPhongMaterial()
            : new THREE.LineBasicMaterial();
          material.name = sourceMaterial.name;
        }

        material.shading = sourceMaterial.smooth
          ? THREE.SmoothShading
          : THREE.FlatShading;

        createdMaterials.push(material);
      }

      // Create mesh

      var mesh;

      if (createdMaterials.length > 1) {
        for (var mii = 0, miiLen = materials.length; mii < miiLen; mii++) {
          let sourceMaterial = materials[mii];
          buffergeometry.addGroup(
            sourceMaterial.groupStart,
            sourceMaterial.groupCount,
            mii
          );
        }

        var multiMaterial = new THREE.MultiMaterial(createdMaterials);
        mesh = !isLine
          ? new THREE.Mesh(buffergeometry, multiMaterial)
          : new THREE.LineSegments(buffergeometry, multiMaterial);
      } else {
        mesh = !isLine
          ? new THREE.Mesh(buffergeometry, createdMaterials[0])
          : new THREE.LineSegments(buffergeometry, createdMaterials[0]);
      }

      mesh.name = object.name;

      container.add(mesh);
    }

    //console.timeEnd( 'OBJLoader' );

    return container;
  }
};

//// ORBIT CONTROL //////

THREE.OrbitControls = function(object, domElement) {
  this.object = object;

  this.domElement = domElement !== undefined ? domElement : document;

  // Set to false to disable this control
  this.enabled = true;

  // "target" sets the location of focus, where the object orbits around
  this.target = new THREE.Vector3();

  // How far you can dolly in and out ( PerspectiveCamera only )
  this.minDistance = 0;
  this.maxDistance = Infinity;

  // How far you can zoom in and out ( OrthographicCamera only )
  this.minZoom = 0;
  this.maxZoom = Infinity;

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  this.minAzimuthAngle = -Infinity; // radians
  this.maxAzimuthAngle = Infinity; // radians

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  this.enableDamping = false;
  this.dampingFactor = 0.25;

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  this.enableZoom = true;
  this.zoomSpeed = 1.0;

  // Set to false to disable rotating
  this.enableRotate = true;
  this.rotateSpeed = 1.0;

  // Set to false to disable panning
  this.enablePan = true;
  this.keyPanSpeed = 7.0; // pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  this.autoRotate = false;
  this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

  // Set to false to disable use of the keys
  this.enableKeys = true;

  // The four arrow keys
  this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

  // Mouse buttons
  this.mouseButtons = {
    ORBIT: THREE.MOUSE.LEFT,
    ZOOM: THREE.MOUSE.MIDDLE,
    PAN: THREE.MOUSE.RIGHT
  };

  // for reset
  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.zoom0 = this.object.zoom;

  //
  // public methods
  //

  this.getPolarAngle = function() {
    return spherical.phi;
  };

  this.getAzimuthalAngle = function() {
    return spherical.theta;
  };

  this.reset = function() {
    scope.target.copy(scope.target0);
    scope.object.position.copy(scope.position0);
    scope.object.zoom = scope.zoom0;

    scope.object.updateProjectionMatrix();
    scope.dispatchEvent(changeEvent);

    scope.update();

    state = STATE.NONE;
  };

  // this method is exposed, but perhaps it would be better if we can make it private...
  this.update = (function() {
    var offset = new THREE.Vector3();

    // so camera.up is the orbit axis
    var quat = new THREE.Quaternion().setFromUnitVectors(
      object.up,
      new THREE.Vector3(0, 1, 0)
    );
    var quatInverse = quat.clone().inverse();

    var lastPosition = new THREE.Vector3();
    var lastQuaternion = new THREE.Quaternion();

    return function update() {
      var position = scope.object.position;

      offset.copy(position).sub(scope.target);

      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion(quat);

      // angle from z-axis around y-axis
      spherical.setFromVector3(offset);

      if (scope.autoRotate && state === STATE.NONE) {
        rotateLeft(getAutoRotationAngle());
      }

      spherical.theta += sphericalDelta.theta;
      spherical.phi += sphericalDelta.phi;

      // restrict theta to be between desired limits
      spherical.theta = Math.max(
        scope.minAzimuthAngle,
        Math.min(scope.maxAzimuthAngle, spherical.theta)
      );

      // restrict phi to be between desired limits
      spherical.phi = Math.max(
        scope.minPolarAngle,
        Math.min(scope.maxPolarAngle, spherical.phi)
      );

      spherical.makeSafe();

      spherical.radius *= scale;

      // restrict radius to be between desired limits
      spherical.radius = Math.max(
        scope.minDistance,
        Math.min(scope.maxDistance, spherical.radius)
      );

      // move target to panned location
      scope.target.add(panOffset);

      offset.setFromSpherical(spherical);

      // rotate offset back to "camera-up-vector-is-up" space
      offset.applyQuaternion(quatInverse);

      position.copy(scope.target).add(offset);

      scope.object.lookAt(scope.target);

      if (scope.enableDamping === true) {
        sphericalDelta.theta *= 1 - scope.dampingFactor;
        sphericalDelta.phi *= 1 - scope.dampingFactor;
      } else {
        sphericalDelta.set(0, 0, 0);
      }

      scale = 1;
      panOffset.set(0, 0, 0);

      // update condition is:
      // min(camera displacement, camera rotation in radians)^2 > EPS
      // using small-angle approximation cos(x/2) = 1 - x^2 / 8

      if (
        zoomChanged ||
        lastPosition.distanceToSquared(scope.object.position) > EPS ||
        8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS
      ) {
        scope.dispatchEvent(changeEvent);

        lastPosition.copy(scope.object.position);
        lastQuaternion.copy(scope.object.quaternion);
        zoomChanged = false;

        return true;
      }

      return false;
    };
  })();

  this.dispose = function() {
    scope.domElement.removeEventListener("contextmenu", onContextMenu, false);
    scope.domElement.removeEventListener("mousedown", onMouseDown, false);
    scope.domElement.removeEventListener("wheel", onMouseWheel, false);

    scope.domElement.removeEventListener("touchstart", onTouchStart, false);
    scope.domElement.removeEventListener("touchend", onTouchEnd, false);
    scope.domElement.removeEventListener("touchmove", onTouchMove, false);

    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);

    window.removeEventListener("keydown", onKeyDown, false);

    //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
  };

  //
  // internals
  //

  var scope = this;

  var changeEvent = { type: "change" };
  var startEvent = { type: "start" };
  var endEvent = { type: "end" };

  var STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY: 4,
    TOUCH_PAN: 5
  };

  var state = STATE.NONE;

  var EPS = 0.000001;

  // current position in spherical coordinates
  var spherical = new THREE.Spherical();
  var sphericalDelta = new THREE.Spherical();

  var scale = 1;
  var panOffset = new THREE.Vector3();
  var zoomChanged = false;

  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();

  var panStart = new THREE.Vector2();
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2();

  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  function getAutoRotationAngle() {
    return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed;
  }

  function getZoomScale() {
    return Math.pow(0.95, scope.zoomSpeed);
  }

  function rotateLeft(angle) {
    sphericalDelta.theta -= angle;
  }

  function rotateUp(angle) {
    sphericalDelta.phi -= angle;
  }

  var panLeft = (function() {
    var v = new THREE.Vector3();

    return function panLeft(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
      v.multiplyScalar(-distance);

      panOffset.add(v);
    };
  })();

  var panUp = (function() {
    var v = new THREE.Vector3();

    return function panUp(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 1); // get Y column of objectMatrix
      v.multiplyScalar(distance);

      panOffset.add(v);
    };
  })();

  // deltaX and deltaY are in pixels; right and down are positive
  var pan = (function() {
    var offset = new THREE.Vector3();

    return function pan(deltaX, deltaY) {
      var element =
        scope.domElement === document
          ? scope.domElement.body
          : scope.domElement;

      if (scope.object instanceof THREE.PerspectiveCamera) {
        // perspective
        var position = scope.object.position;
        offset.copy(position).sub(scope.target);
        var targetDistance = offset.length();

        // half of the fov is center to top of screen
        targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0);

        // we actually don't use screenWidth, since perspective camera is fixed to screen height
        panLeft(
          (2 * deltaX * targetDistance) / element.clientHeight,
          scope.object.matrix
        );
        panUp(
          (2 * deltaY * targetDistance) / element.clientHeight,
          scope.object.matrix
        );
      } else if (scope.object instanceof THREE.OrthographicCamera) {
        // orthographic
        panLeft(
          (deltaX * (scope.object.right - scope.object.left)) /
            scope.object.zoom /
            element.clientWidth,
          scope.object.matrix
        );
        panUp(
          (deltaY * (scope.object.top - scope.object.bottom)) /
            scope.object.zoom /
            element.clientHeight,
          scope.object.matrix
        );
      } else {
        // camera neither orthographic nor perspective
        // console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
        scope.enablePan = false;
      }
    };
  })();

  function dollyIn(dollyScale) {
    if (scope.object instanceof THREE.PerspectiveCamera) {
      scale /= dollyScale;
    } else if (scope.object instanceof THREE.OrthographicCamera) {
      scope.object.zoom = Math.max(
        scope.minZoom,
        Math.min(scope.maxZoom, scope.object.zoom * dollyScale)
      );
      scope.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      // console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
      scope.enableZoom = false;
    }
  }

  function dollyOut(dollyScale) {
    if (scope.object instanceof THREE.PerspectiveCamera) {
      scale *= dollyScale;
    } else if (scope.object instanceof THREE.OrthographicCamera) {
      scope.object.zoom = Math.max(
        scope.minZoom,
        Math.min(scope.maxZoom, scope.object.zoom / dollyScale)
      );
      scope.object.updateProjectionMatrix();
      zoomChanged = true;
    } else {
      // console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
      scope.enableZoom = false;
    }
  }

  //
  // event callbacks - update the object state
  //

  function handleMouseDownRotate(event) {
    ////console.log( 'handleMouseDownRotate' );

    rotateStart.set(event.clientX, event.clientY);
  }

  function handleMouseDownDolly(event) {
    ////console.log( 'handleMouseDownDolly' );

    dollyStart.set(event.clientX, event.clientY);
  }

  function handleMouseDownPan(event) {
    ////console.log( 'handleMouseDownPan' );

    panStart.set(event.clientX, event.clientY);
  }

  function handleMouseMoveRotate(event) {
    ////console.log( 'handleMouseMoveRotate' );

    rotateEnd.set(event.clientX, event.clientY);
    rotateDelta.subVectors(rotateEnd, rotateStart);

    var element =
      scope.domElement === document ? scope.domElement.body : scope.domElement;

    // rotating across whole screen goes 360 degrees around
    rotateLeft(
      ((2 * Math.PI * rotateDelta.x) / element.clientWidth) * scope.rotateSpeed
    );

    // rotating up and down along whole screen attempts to go 360, but limited to 180
    rotateUp(
      ((2 * Math.PI * rotateDelta.y) / element.clientHeight) * scope.rotateSpeed
    );

    rotateStart.copy(rotateEnd);

    scope.update();
  }

  function handleMouseMoveDolly(event) {
    ////console.log( 'handleMouseMoveDolly' );

    dollyEnd.set(event.clientX, event.clientY);

    dollyDelta.subVectors(dollyEnd, dollyStart);

    if (dollyDelta.y > 0) {
      dollyIn(getZoomScale());
    } else if (dollyDelta.y < 0) {
      dollyOut(getZoomScale());
    }

    dollyStart.copy(dollyEnd);

    scope.update();
  }

  function handleMouseMovePan(event) {
    ////console.log( 'handleMouseMovePan' );

    panEnd.set(event.clientX, event.clientY);

    panDelta.subVectors(panEnd, panStart);

    pan(panDelta.x, panDelta.y);

    panStart.copy(panEnd);

    scope.update();
  }

  function handleMouseUp(/*event */) {
    //// console.log( 'handleMouseUp' );
  }

  function handleMouseWheel(event) {
    //// console.log( 'handleMouseWheel' );

    if (event.deltaY < 0) {
      dollyOut(getZoomScale());
    } else if (event.deltaY > 0) {
      dollyIn(getZoomScale());
    }

    scope.update();
  }

  function handleKeyDown(event) {
    ////console.log( 'handleKeyDown' );

    switch (event.keyCode) {
      case scope.keys.UP:
        pan(0, scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.BOTTOM:
        pan(0, -scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.LEFT:
        pan(scope.keyPanSpeed, 0);
        scope.update();
        break;

      case scope.keys.RIGHT:
        pan(-scope.keyPanSpeed, 0);
        scope.update();
        break;
    }
  }

  function handleTouchStartRotate(event) {
    ////console.log( 'handleTouchStartRotate' );

    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  function handleTouchStartDolly(event) {
    ////console.log( 'handleTouchStartDolly' );

    var dx = event.touches[0].pageX - event.touches[1].pageX;
    var dy = event.touches[0].pageY - event.touches[1].pageY;

    var distance = Math.sqrt(dx * dx + dy * dy);

    dollyStart.set(0, distance);
  }

  function handleTouchStartPan(event) {
    ////console.log( 'handleTouchStartPan' );

    panStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  function handleTouchMoveRotate(event) {
    ////console.log( 'handleTouchMoveRotate' );

    rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    rotateDelta.subVectors(rotateEnd, rotateStart);

    var element =
      scope.domElement === document ? scope.domElement.body : scope.domElement;

    // rotating across whole screen goes 360 degrees around
    rotateLeft(
      ((2 * Math.PI * rotateDelta.x) / element.clientWidth) * scope.rotateSpeed
    );

    // rotating up and down along whole screen attempts to go 360, but limited to 180
    rotateUp(
      ((2 * Math.PI * rotateDelta.y) / element.clientHeight) * scope.rotateSpeed
    );

    rotateStart.copy(rotateEnd);

    scope.update();
  }

  function handleTouchMoveDolly(event) {
    ////console.log( 'handleTouchMoveDolly' );

    var dx = event.touches[0].pageX - event.touches[1].pageX;
    var dy = event.touches[0].pageY - event.touches[1].pageY;

    var distance = Math.sqrt(dx * dx + dy * dy);

    dollyEnd.set(0, distance);

    dollyDelta.subVectors(dollyEnd, dollyStart);

    if (dollyDelta.y > 0) {
      dollyOut(getZoomScale());
    } else if (dollyDelta.y < 0) {
      dollyIn(getZoomScale());
    }

    dollyStart.copy(dollyEnd);

    scope.update();
  }

  function handleTouchMovePan(event) {
    ////console.log( 'handleTouchMovePan' );

    panEnd.set(event.touches[0].pageX, event.touches[0].pageY);

    panDelta.subVectors(panEnd, panStart);

    pan(panDelta.x, panDelta.y);

    panStart.copy(panEnd);

    scope.update();
  }

  function handleTouchEnd(/*event */) {
    ////console.log( 'handleTouchEnd' );
  }

  //
  // event handlers - FSM: listen for events and reset state
  //

  function onMouseDown(event) {
    if (scope.enabled === false) return;

    event.preventDefault();

    if (event.button === scope.mouseButtons.ORBIT) {
      if (scope.enableRotate === false) return;

      handleMouseDownRotate(event);

      state = STATE.ROTATE;
    } else if (event.button === scope.mouseButtons.ZOOM) {
      if (scope.enableZoom === false) return;

      handleMouseDownDolly(event);

      state = STATE.DOLLY;
    } else if (event.button === scope.mouseButtons.PAN) {
      if (scope.enablePan === false) return;

      handleMouseDownPan(event);

      state = STATE.PAN;
    }

    if (state !== STATE.NONE) {
      document.addEventListener("mousemove", onMouseMove, false);
      document.addEventListener("mouseup", onMouseUp, false);

      scope.dispatchEvent(startEvent);
    }
  }

  function onMouseMove(event) {
    if (scope.enabled === false) return;

    event.preventDefault();

    if (state === STATE.ROTATE) {
      if (scope.enableRotate === false) return;

      handleMouseMoveRotate(event);
    } else if (state === STATE.DOLLY) {
      if (scope.enableZoom === false) return;

      handleMouseMoveDolly(event);
    } else if (state === STATE.PAN) {
      if (scope.enablePan === false) return;

      handleMouseMovePan(event);
    }
  }

  function onMouseUp(event) {
    if (scope.enabled === false) return;

    handleMouseUp(event);

    document.removeEventListener("mousemove", onMouseMove, false);
    document.removeEventListener("mouseup", onMouseUp, false);

    scope.dispatchEvent(endEvent);

    state = STATE.NONE;
  }

  function onMouseWheel(event) {
    if (
      scope.enabled === false ||
      scope.enableZoom === false ||
      (state !== STATE.NONE && state !== STATE.ROTATE)
    )
      return;

    event.preventDefault();
    event.stopPropagation();

    handleMouseWheel(event);

    scope.dispatchEvent(startEvent); // not sure why these are here...
    scope.dispatchEvent(endEvent);
  }

  function onKeyDown(event) {
    if (
      scope.enabled === false ||
      scope.enableKeys === false ||
      scope.enablePan === false
    )
      return;

    handleKeyDown(event);
  }

  function onTouchStart(event) {
    if (scope.enabled === false) return;

    switch (event.touches.length) {
      case 1: // one-fingered touch: rotate
        if (scope.enableRotate === false) return;

        handleTouchStartRotate(event);

        state = STATE.TOUCH_ROTATE;

        break;

      case 2: // two-fingered touch: dolly
        if (scope.enableZoom === false) return;

        handleTouchStartDolly(event);

        state = STATE.TOUCH_DOLLY;

        break;

      case 3: // three-fingered touch: pan
        if (scope.enablePan === false) return;

        handleTouchStartPan(event);

        state = STATE.TOUCH_PAN;

        break;

      default:
        state = STATE.NONE;
    }

    if (state !== STATE.NONE) {
      scope.dispatchEvent(startEvent);
    }
  }

  function onTouchMove(event) {
    if (scope.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1: // one-fingered touch: rotate
        if (scope.enableRotate === false) return;
        if (state !== STATE.TOUCH_ROTATE) return; // is this needed?...

        handleTouchMoveRotate(event);

        break;

      case 2: // two-fingered touch: dolly
        if (scope.enableZoom === false) return;
        if (state !== STATE.TOUCH_DOLLY) return; // is this needed?...

        handleTouchMoveDolly(event);

        break;

      case 3: // three-fingered touch: pan
        if (scope.enablePan === false) return;
        if (state !== STATE.TOUCH_PAN) return; // is this needed?...

        handleTouchMovePan(event);

        break;

      default:
        state = STATE.NONE;
    }
  }

  function onTouchEnd(event) {
    if (scope.enabled === false) return;

    handleTouchEnd(event);

    scope.dispatchEvent(endEvent);

    state = STATE.NONE;
  }

  function onContextMenu(event) {
    event.preventDefault();
  }

  //

  scope.domElement.addEventListener("contextmenu", onContextMenu, false);

  scope.domElement.addEventListener("mousedown", onMouseDown, false);
  scope.domElement.addEventListener("wheel", onMouseWheel, false);

  scope.domElement.addEventListener("touchstart", onTouchStart, false);
  scope.domElement.addEventListener("touchend", onTouchEnd, false);
  scope.domElement.addEventListener("touchmove", onTouchMove, false);

  window.addEventListener("keydown", onKeyDown, false);

  // force an update at start

  this.update();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;

Object.defineProperties(THREE.OrbitControls.prototype, {
  center: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .center has been renamed to .target' );
      return this.target;
    }
  },

  // backward compatibility

  noZoom: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
      return !this.enableZoom;
    },

    set: function(value) {
      // console.warn( 'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.' );
      this.enableZoom = !value;
    }
  },

  noRotate: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
      return !this.enableRotate;
    },

    set: function(value) {
      // console.warn( 'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.' );
      this.enableRotate = !value;
    }
  },

  noPan: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
      return !this.enablePan;
    },

    set: function(value) {
      // console.warn( 'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.' );
      this.enablePan = !value;
    }
  },

  noKeys: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
      return !this.enableKeys;
    },

    set: function(value) {
      // console.warn( 'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.' );
      this.enableKeys = !value;
    }
  },

  staticMoving: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
      return !this.enableDamping;
    },

    set: function(value) {
      // console.warn( 'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.' );
      this.enableDamping = !value;
    }
  },

  dynamicDampingFactor: {
    get: function() {
      // console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
      return this.dampingFactor;
    },

    set: function(value) {
      // console.warn( 'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.' );
      this.dampingFactor = value;
    }
  }
});

/// OUR JS PYRAMIDE ///

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x2e2b30);

var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("pyramide").appendChild(renderer.domElement);
//document.body.appendChild(renderer.domElement);

new THREE.OrbitControls(camera, renderer.domElement);

window.addEventListener("resize", function() {
  var width = window.innerWidth;
  var height = window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

var geometry = new THREE.ConeBufferGeometry(1, 1, 4, 4, true);

var material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true
});

var cone = new THREE.Mesh(geometry, material);
scene.add(cone);

camera.position.z = 3;

var keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(-100, 0, 100);

var fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(100, 0, 100);

var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(100, 0, -100).normalize();

scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);

function animate() {
  requestAnimationFrame(animate);

  cone.rotation.y += 0.005;
}

animate();

var render = function() {
  renderer.render(scene, camera);
};

var GameLoop = function() {
  requestAnimationFrame(GameLoop);
  render();
};

GameLoop();

// OR specifying custom default options for all uses of the directive
Vue.use(VueScrollReveal, {
  class: "v-scroll-reveal",
  origin: "top",
  duration: 1800,
  scale: 1
});
