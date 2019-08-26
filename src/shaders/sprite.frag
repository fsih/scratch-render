precision mediump float;
uniform sampler2D u_skin;
varying vec2 v_texCoord;

void main()
{
	vec2 texcoord0 = v_texCoord;
	gl_FragColor = texture2D(u_skin, texcoord0);
}
