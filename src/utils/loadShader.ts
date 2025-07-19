export async function loadShader(gl: WebGL2RenderingContext, path: string, type: number): Promise<WebGLShader> {
  console.info(`Loading shader from path:`, path)
  const response = await fetch(path)
  const src = await response.text()

  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!success) {
    const log = gl.getShaderInfoLog(shader)
    console.error(`Error compiling shader:\n${ log }\nSource:\n${ src }`)
  }

  return shader
}
