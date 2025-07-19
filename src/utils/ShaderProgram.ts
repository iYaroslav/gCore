import { type mat4, type mat2, type mat3 } from 'gl-matrix'
import { loadShader } from './loadShader.ts'

export class ShaderProgram {
  readonly gl: WebGL2RenderingContext
  public program: WebGLProgram
  uniforms: Map<string, WebGLUniformLocation> = new Map()
  attributes: Map<string, number> = new Map()

  private constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
    this.gl = gl
    this.program = program
  }

  static async create(gl: WebGL2RenderingContext, path: string) {
    const vertexShader = await loadShader(gl, `/shaders/${ path }/vertex.glsl`, gl.VERTEX_SHADER)
    const fragmentShader = await loadShader(gl, `/shaders/${ path }/fragment.glsl`, gl.FRAGMENT_SHADER)

    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    // console.log('For', path)
    // const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    // for (let i = 0; i < numAttribs; i++) {
    //   const info = gl.getActiveAttrib(program, i)
    //   console.log(`[ATTRIB ${i}]`, info?.name, info?.type, info?.size)
    // }

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Shader program ${ path } failed to link:`, gl.getProgramInfoLog(program))
      console.error('Vertex Shader Log:', gl.getShaderInfoLog(vertexShader))
      console.error('Fragment Shader Log:', gl.getShaderInfoLog(fragmentShader))

      throw new Error('Shader compilation failed')
    }

    return new ShaderProgram(gl, program)
  }

  use() {
    this.gl.useProgram(this.program)
  }

  getUniform(name: string): WebGLUniformLocation {
    if (!this.uniforms.has(name)) {
      const loc = this.gl.getUniformLocation(this.program, name)

      if (loc) {
        this.uniforms.set(name, loc)
      // } else {
      //   console.warn(`Uniform "${ name }" not found`)
      }
    }

    return this.uniforms.get(name)!
  }

  hasAttribute(name: string): boolean {
    return this.gl.getAttribLocation(this.program, name) !== -1
  }

  getAttribute(name: string): number {
    if (!this.attributes.has(name)) {
      const loc = this.gl.getAttribLocation(this.program, name)
      if (loc === -1) throw new Error(`Attribute "${ name }" not found`)
      this.attributes.set(name, loc)
    }

    return this.attributes.get(name)!
  }

  setAttribute(config: {
    [name: string]: {
      size: number
      type?: number
      normalized?: boolean
      stride?: number
      offset?: number
    }
  }) {
    const gl = this.gl
    for (const name in config) {
      const loc = this.getAttribute(name)
      if (loc === -1) continue

      const {
        size, type = gl.FLOAT, normalized = false, stride = 0, offset = 0,
      } = config[name]

      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, type, normalized, stride, offset)
    }
  }

  setUniform(name: string, value: any) {
    const gl = this.gl
    const loc = this.getUniform(name)
    if (loc == null) return

    if (typeof value === 'boolean') {
      gl.uniform1i(loc, value ? 1 : 0)
    } else if (typeof value === 'number') {
      gl.uniform1f(loc, value)
    } else if (value instanceof Int32Array) {
      switch (value.length) {
        case 1: gl.uniform1iv(loc, value); break
        case 2: gl.uniform2iv(loc, value); break
        case 3: gl.uniform3iv(loc, value); break
        case 4: gl.uniform4iv(loc, value); break
      }
    } else if (value instanceof Float32Array) {
      switch (value.length) {
        case 2: gl.uniform2fv(loc, value); break
        case 3: gl.uniform3fv(loc, value); break
        case 4: gl.uniform4fv(loc, value); break
        case 4: gl.uniformMatrix2fv(loc, false, value); break
        case 9: gl.uniformMatrix3fv(loc, false, value); break
        case 16: gl.uniformMatrix4fv(loc, false, value); break
      }
    } else if (Array.isArray(value)) {
      const len = value.length
      if (len === 1) gl.uniform1f(loc, value[0])
      else if (len === 2) gl.uniform2f(loc, value[0], value[1])
      else if (len === 3) gl.uniform3f(loc, value[0], value[1], value[2])
      else if (len === 4) gl.uniform4f(loc, value[0], value[1], value[2], value[3])
      else if (len === 9) gl.uniformMatrix3fv(loc, false, new Float32Array(value))
      else if (len === 16) gl.uniformMatrix4fv(loc, false, new Float32Array(value))
    } else {
      console.warn(`Unsupported uniform type for ${name}:`, value)
    }
  }

  setUniformMatrix(name: string, mat: mat2 | mat3 | mat4 | Float32Array | number[]) {
    const gl = this.gl
    const loc = this.getUniform(name)
    if (!loc) return

    const arr = mat instanceof Float32Array ? mat : new Float32Array(mat)

    switch (arr.length) {
      case 4:  gl.uniformMatrix2fv(loc, false, arr); break
      case 9:  gl.uniformMatrix3fv(loc, false, arr); break
      case 16: gl.uniformMatrix4fv(loc, false, arr); break
      default: console.warn(`Unsupported matrix length for ${name}: ${arr.length}`)
    }
  }

  setUniformTexture(name: string, texture: WebGLTexture, unit: number = 0) {
    const gl = this.gl
    const loc = this.getUniform(name)
    if (!loc) return

    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(loc, unit)
  }

  get raw(): WebGLProgram {
    return this.program
  }
}
