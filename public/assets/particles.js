/* Campo de partículas WebGL do cartão.
   Porte direto do protótipo Particles.jsx (que usava React + ogl) para WebGL puro:
   mesmos shaders, mesma câmera e mesmos parâmetros, sem dependência de CDN. */
(function () {
  'use strict';

  var VERTEX = [
    'attribute vec3 position;',
    'attribute vec4 random;',
    'attribute vec3 color;',
    'uniform mat4 modelMatrix;',
    'uniform mat4 viewMatrix;',
    'uniform mat4 projectionMatrix;',
    'uniform float uTime;',
    'uniform float uSpread;',
    'uniform float uBaseSize;',
    'uniform float uSizeRandomness;',
    'varying vec4 vRandom;',
    'varying vec3 vColor;',
    'void main() {',
    '  vRandom = random;',
    '  vColor = color;',
    '  vec3 pos = position * uSpread;',
    '  pos.z *= 10.0;',
    '  vec4 mPos = modelMatrix * vec4(pos, 1.0);',
    '  float t = uTime;',
    '  mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);',
    '  mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);',
    '  mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);',
    '  vec4 mvPos = viewMatrix * mPos;',
    '  if (uSizeRandomness == 0.0) {',
    '    gl_PointSize = uBaseSize;',
    '  } else {',
    '    gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);',
    '  }',
    '  gl_Position = projectionMatrix * mvPos;',
    '}'
  ].join('\n');

  var FRAGMENT = [
    'precision highp float;',
    'uniform float uTime;',
    'uniform float uAlphaParticles;',
    'varying vec4 vRandom;',
    'varying vec3 vColor;',
    'void main() {',
    '  vec2 uv = gl_PointCoord.xy;',
    '  float d = length(uv - vec2(0.5));',
    '  if (uAlphaParticles < 0.5) {',
    '    if (d > 0.5) { discard; }',
    '    gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);',
    '  } else {',
    '    float circle = smoothstep(0.5, 0.4, d) * 0.8;',
    '    gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);',
    '  }',
    '}'
  ].join('\n');

  var DEFAULTS = {
    particleCount: 200,
    particleSpread: 10,
    speed: 0.1,
    particleColors: ['#ffffff'],
    moveParticlesOnHover: false,
    particleHoverFactor: 1,
    alphaParticles: false,
    particleBaseSize: 100,
    sizeRandomness: 1,
    cameraDistance: 20,
    fov: 15,
    disableRotation: false,
    pixelRatio: 1
  };

  function hexToRgb(hex) {
    hex = String(hex).replace(/^#/, '');
    if (hex.length === 3) hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    var int = parseInt(hex.slice(0, 6), 16);
    return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
  }

  /* --- mat4 mínimo, column-major (ordem que o WebGL espera) --- */

  function identity() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  function multiply(a, b, out) {
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] =
          a[r] * b[c * 4] +
          a[4 + r] * b[c * 4 + 1] +
          a[8 + r] * b[c * 4 + 2] +
          a[12 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  function perspective(fovDeg, aspect, near, far) {
    var f = 1 / Math.tan((fovDeg * Math.PI) / 360);
    var nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  }

  function rotationX(t, out) {
    var c = Math.cos(t), s = Math.sin(t);
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = c; out[6] = s; out[7] = 0;
    out[8] = 0; out[9] = -s; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }

  function rotationY(t, out) {
    var c = Math.cos(t), s = Math.sin(t);
    out[0] = c; out[1] = 0; out[2] = -s; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = s; out[9] = 0; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }

  function rotationZ(t, out) {
    var c = Math.cos(t), s = Math.sin(t);
    out[0] = c; out[1] = s; out[2] = 0; out[3] = 0;
    out[4] = -s; out[5] = c; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function init(container, options) {
    if (!container) return null;

    var opts = {};
    var key;
    for (key in DEFAULTS) opts[key] = DEFAULTS[key];
    for (key in options || {}) opts[key] = options[key];

    var canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    var gl = canvas.getContext('webgl', { alpha: true, depth: false, antialias: false }) ||
      canvas.getContext('experimental-webgl', { alpha: true, depth: false, antialias: false });
    if (!gl) return null;

    var vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return null;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    container.appendChild(canvas);

    var count = opts.particleCount;
    var positions = new Float32Array(count * 3);
    var randoms = new Float32Array(count * 4);
    var colors = new Float32Array(count * 3);
    // Guardado para que trocar de tema recolora as mesmas partículas em vez de
    // sortear o campo inteiro de novo (o que apareceria como um "salto").
    var paletteIndex = new Uint16Array(count);

    var palette = opts.particleColors && opts.particleColors.length ? opts.particleColors : DEFAULTS.particleColors;

    for (var i = 0; i < count; i++) {
      var x, y, z, len;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      var r = Math.cbrt(Math.random());
      positions[i * 3] = x * r;
      positions[i * 3 + 1] = y * r;
      positions[i * 3 + 2] = z * r;
      randoms[i * 4] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
      paletteIndex[i] = Math.floor(Math.random() * palette.length);
    }

    function fillColors(list) {
      for (var j = 0; j < count; j++) {
        var rgb = hexToRgb(list[paletteIndex[j] % list.length]);
        colors[j * 3] = rgb[0];
        colors[j * 3 + 1] = rgb[1];
        colors[j * 3 + 2] = rgb[2];
      }
    }
    fillColors(palette);

    function buffer(data, size, name) {
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      return buf;
    }

    buffer(positions, 3, 'position');
    buffer(randoms, 4, 'random');
    var colorBuffer = buffer(colors, 3, 'color');

    var uModel = gl.getUniformLocation(program, 'modelMatrix');
    var uView = gl.getUniformLocation(program, 'viewMatrix');
    var uProjection = gl.getUniformLocation(program, 'projectionMatrix');
    var uTime = gl.getUniformLocation(program, 'uTime');

    gl.uniform1f(gl.getUniformLocation(program, 'uSpread'), opts.particleSpread);
    gl.uniform1f(gl.getUniformLocation(program, 'uBaseSize'), opts.particleBaseSize * opts.pixelRatio);
    gl.uniform1f(gl.getUniformLocation(program, 'uSizeRandomness'), opts.sizeRandomness);
    gl.uniform1f(gl.getUniformLocation(program, 'uAlphaParticles'), opts.alphaParticles ? 1 : 0);

    // Câmera parada em (0, 0, cameraDistance) olhando para a origem:
    // a matriz de view é só a translação inversa.
    var view = identity();
    view[14] = -opts.cameraDistance;
    gl.uniformMatrix4fv(uView, false, view);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var model = identity();
    var rot = identity();
    var tmpA = identity();
    var tmpB = identity();

    function updateModel(px, py, rx, ry, rz) {
      // Mesma ordem de Euler do ogl/three (YXZ): R = Ry * Rx * Rz
      multiply(rotationY(ry, tmpA), rotationX(rx, tmpB), rot);
      multiply(rot, rotationZ(rz, tmpB), model);
      model[12] = px;
      model[13] = py;
      model[14] = 0;
      gl.uniformMatrix4fv(uModel, false, model);
    }

    function resize() {
      var w = container.clientWidth || window.innerWidth;
      var h = container.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * opts.pixelRatio));
      canvas.height = Math.max(1, Math.round(h * opts.pixelRatio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniformMatrix4fv(uProjection, false, perspective(opts.fov, canvas.width / canvas.height, 0.1, 100));
    }

    var mouse = { x: 0, y: 0 };
    function onMouseMove(e) {
      var rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var elapsed = 0;
    var lastTime = 0;
    var rotZ = 0;
    var frame = 0;

    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, elapsed * 0.001);

      var px = 0, py = 0;
      if (opts.moveParticlesOnHover) {
        px = -mouse.x * opts.particleHoverFactor;
        py = -mouse.y * opts.particleHoverFactor;
      }

      var rx = 0, ry = 0;
      if (!opts.disableRotation) {
        rx = Math.sin(elapsed * 0.0002) * 0.1;
        ry = Math.cos(elapsed * 0.0005) * 0.15;
      }

      updateModel(px, py, rx, ry, opts.disableRotation ? 0 : rotZ);
      gl.drawArrays(gl.POINTS, 0, count);
    }

    function tick(now) {
      frame = requestAnimationFrame(tick);
      if (!lastTime) lastTime = now;
      var delta = now - lastTime;
      lastTime = now;
      elapsed += delta * opts.speed;
      if (!opts.disableRotation) rotZ += 0.01 * opts.speed;
      draw();
    }

    function start() {
      if (frame || reduceMotion) return;
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }

    function stop() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    window.addEventListener('resize', resize);
    if (opts.moveParticlesOnHover && !reduceMotion) window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    if (reduceMotion) draw();
    else start();

    return {
      setColors: function (list) {
        if (!list || !list.length) return;
        fillColors(list);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, colors);
        if (reduceMotion) draw();
      },
      destroy: function () {
        stop();
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('visibilitychange', onVisibility);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  window.KLParticles = { init: init };
})();
