export type SceneUniforms = {
  uModel: WebGLUniformLocation
  uView: WebGLUniformLocation
  uProjection: WebGLUniformLocation
  uLightViewProjection: WebGLUniformLocation
  uShadowMap: WebGLUniformLocation
  uLightDirection: WebGLUniformLocation
  uLightColor: WebGLUniformLocation
  uObjectColor: WebGLUniformLocation
}

export default function getSceneUniformLocations(gl: WebGL2RenderingContext, program: WebGLProgram): SceneUniforms {
  return {
    uModel: gl.getUniformLocation(program, 'uModel')!,
    uView: gl.getUniformLocation(program, 'uView')!,
    uProjection: gl.getUniformLocation(program, 'uProjection')!,
    uLightViewProjection: gl.getUniformLocation(program, 'uLightViewProjection')!,
    uShadowMap: gl.getUniformLocation(program, 'uShadowMap')!,
    uLightDirection: gl.getUniformLocation(program, 'uLightDirection')!,
    uLightColor: gl.getUniformLocation(program, 'uLightColor')!,
    uObjectColor: gl.getUniformLocation(program, 'uObjectColor')!,
  }
}
