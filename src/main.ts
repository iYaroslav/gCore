import { mat4 } from 'gl-matrix'
import loadCube, { drawCube } from './objects/cube.ts'
import { ShaderProgram } from './utils/ShaderProgram.ts'
import './style.css'

const canvas = document.getElementById("game") as HTMLCanvasElement
const gl = canvas.getContext("webgl2")!
const vbo = gl.createBuffer()
const ebo = gl.createBuffer()

let scene: ShaderProgram
let shadow: ShaderProgram
let debug: ShaderProgram

const DEMO_SHADERS = false
const DEBUG = false

const cubeSize = 1
const cubeBevel = 0.05

const model = mat4.create()
const view = mat4.create()
const projection = mat4.create()
const lightView = mat4.create()
const lightProjection = mat4.create()
const lightVP = mat4.create()

const eye = [2, 2, 4]
mat4.lookAt(view, new Float32Array(eye), [0, 0, 0], [0, 1, 0])
mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 100)
mat4.lookAt(lightView, [3, 6, 3], [0, 0, 0], [0, 1, 0])
mat4.ortho(lightProjection, -5, 5, -5, 5, 1, 20) // ортографическая проекция для света
mat4.multiply(lightVP, lightProjection, lightView)

const depthFBO = gl.createFramebuffer()
const depthTex = gl.createTexture()

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  gl.viewport(0, 0, canvas.width, canvas.height)
  mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 100)
}

window.addEventListener("resize", resizeCanvas)
resizeCanvas()

function setupAttributes(prog: ShaderProgram, type: string) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  // const stride = 6 * 4

  // if (prog.hasAttribute('aPosition')) {
  //   const pos = prog.getAttribute('aPosition')
  //
  //   gl.enableVertexAttribArray(pos)
  //   gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, stride, 0)
  // }
  //
  //
  // if (prog.hasAttribute('aNormal')) {
  //   const norm = prog.getAttribute('aNormal')
  //
  //   gl.enableVertexAttribArray(norm)
  //   gl.vertexAttribPointer(norm, 3, gl.FLOAT, false, stride, 3 * 4)
  // }
  const stride = DEMO_SHADERS ? 7 * 4 : 8 * 4

  if (type === 'shadow') {
    prog.setAttribute({
      aPosition: { size: 3, stride, offset: 0 },
    })
  } else {
    if (DEMO_SHADERS) {
      prog.setAttribute({
        aPosition: { size: 3, stride, offset: 0 },
        aNormal:   { size: 3, stride, offset: 3 * 4 },
        aFaceId:   { size: 1, stride, offset: 6 * 4 }
      })
    } else {
      prog.setAttribute({
        aPosition: { size: 3, stride, offset: 0 },
        aNormal:   { size: 3, stride, offset: 3 * 4 },
        aUV:   { size: 2, stride, offset: 6 * 4 },
      })
    }
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
}

function initShadowBuffer() {
  const size = 1024

  gl.bindTexture(gl.TEXTURE_2D, depthTex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFBO)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0)
  gl.drawBuffers([gl.NONE])
  gl.readBuffer(gl.NONE)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}

function render(time: number) {
  time *= 0.001
  mat4.identity(model)

  // mat4.rotateX(model, model, 10)
  // mat4.rotateY(model, model, 30)

  mat4.rotateY(model, model, time * 0.5)
  mat4.rotateX(model, model, time * 0.3)
  // mat4.rotateY(model, model, time)
  // mat4.rotateX(model, model, time)

  // Shadow pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFBO)
  gl.viewport(0, 0, 1024, 1024)
  gl.clear(gl.DEPTH_BUFFER_BIT)

  shadow.use()
  shadow.setUniformMatrix('uModel', model)
  shadow.setUniformMatrix('uLightViewProjection', lightVP)

  setupAttributes(shadow, 'shadow')
  drawCube(gl)

  // Main pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  resizeCanvas()
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  if (DEBUG) {
    debug.use()
    debug.setUniformMatrix('uModel', model)
    debug.setUniformMatrix('uView', view)
    debug.setUniformMatrix('uProjection', projection)
    setupAttributes(scene, 'debug')
    drawCube(gl)
  }

  scene.use()
  scene.setUniformMatrix('uModel', model)
  scene.setUniformMatrix('uView', view)
  scene.setUniformMatrix('uProjection', projection)
  scene.setUniformMatrix('uLightViewProjection', lightVP)

  if (DEMO_SHADERS) {
    scene.setUniform('uTime', time)
  } else {
    scene.setUniform('uCameraPos', eye)
  }

  scene.setUniform('uLightDirection', [-0.5, -1, -0.3])
  scene.setUniform('uLightColor', [1, 1, 1])
  scene.setUniform('uObjectColor', [0.8, 0.2, 0.3])

  scene.setUniformTexture('uShadowMap', depthTex, 0)

  const inner = cubeSize / 2 - cubeBevel;

  scene.setUniform('uInner', [inner, inner, inner]);
  scene.setUniform('uBevel', cubeBevel);
  scene.setUniform('uSpecularPower', 128);
  scene.setUniform('uSpecularIntensity', 1);

  setupAttributes(scene, 'scene')
  drawCube(gl)

  requestAnimationFrame(render)
}

async function main() {
  gl.enable(gl.DEPTH_TEST)
  // gl.clear(gl.DEPTH_BUFFER_BIT)
  // gl.enable(gl.CULL_FACE)
  gl.clearColor(0.1, 0.1, 0.1, 1.0)

  scene = await ShaderProgram.create(gl, DEMO_SHADERS ? 'scene' : 'cube')
  shadow = await ShaderProgram.create(gl, 'shadow')

  if (DEBUG) {
    debug = await ShaderProgram.create(gl, 'debug')
  }

  initShadowBuffer()
  loadCube(gl, vbo, ebo, !DEMO_SHADERS, cubeSize, cubeBevel)

  render(0)
}

main().catch(console.error)
