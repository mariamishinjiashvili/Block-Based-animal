// animal.js - Dog standing on rear legs

// Vertex Shader Source
// Handles positioning, lighting, and color of each vertex
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +      // Vertex position
  'attribute vec4 a_Color;\n' +         // Vertex color
  'attribute vec4 a_Normal;\n' +        // Vertex normal for lighting
  'uniform mat4 u_ModelMatrix;\n' +     // Model transformation matrix
  'uniform mat4 u_MvpMatrix;\n' +       // Model-View-Projection matrix
  'uniform mat4 u_NormalMatrix;\n' +    // Normal transformation matrix
  'uniform vec3 u_LightColor;\n' +      // Color of the light
  'uniform vec3 u_LightPosition;\n' +   // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +    // Ambient light color
  'varying vec4 v_Color;\n' +           // Varying to pass color to fragment shader
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +  // Transform vertex to clip space
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' + // Transform normal
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' + // Vertex position in world space
  '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' + // Direction to light
  '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' + // Diffuse factor
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' + // Diffuse component
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +       // Ambient component
  '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +     // Final color output
  '}\n';

// Fragment Shader Source
// Computes the final color for each pixel
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +       // Medium precision floats for WebGL ES
  '#endif\n' +
  'varying vec4 v_Color;\n' +          // Interpolated color from vertex shader
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +      // Output final pixel color
  '}\n';

// Animation state variables
var legAngle = 0.0;    // Angle for leg movement animation
var standAngle = 0.0;  // Angle for standing (body tilt)
var keys = {};          // Object to track key presses

function main() {
  var canvas = document.getElementById('webgl'); // Get canvas element
  var gl = getWebGLContext(canvas);             // Get WebGL rendering context
  if (!gl) return;

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) return; // Compile shaders

  var n = initVertexBuffers(gl); // Initialize cube vertex buffers
  if (n < 0) return;

  gl.clearColor(0, 0, 0, 1);    // Set background color to black
  gl.enable(gl.DEPTH_TEST);     // Enable depth testing

  // Get uniform locations from shader
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

  // Camera setup: perspective + view matrix
  var vpMatrix = new Matrix4();
  vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100); // FOV, aspect, near/far
  vpMatrix.lookAt(10, 8, 20, 0, 0, 0, 0, 1, 0); // Camera position, target, up vector

  // Lighting setup
  gl.uniform3f(u_LightColor, 1, 1, 1);        // White light
  gl.uniform3f(u_LightPosition, 5, 8, 10);    // Light position in world coordinates
  gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3); // Ambient light

  // Keyboard event handlers
  document.onkeydown = ev => keys[ev.key] = true; // Key pressed
  document.onkeyup = ev => keys[ev.key] = false;  // Key released

  function tick() {
    // --- Handle user input for animation ---
    if (keys['ArrowLeft']) legAngle += 2;       // Rotate legs left
    if (keys['ArrowRight']) legAngle -= 2;      // Rotate legs right
    if (keys['ArrowUp'] && standAngle < 60) standAngle += 1.5; // Stand up
    if (keys['ArrowDown'] && standAngle > 0) standAngle -= 1.5; // Sit down

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear canvas

    var yOffset = standAngle * 0.02; // Lift body slightly when standing

    // --- Draw rear legs (grounded) ---
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      -1.2, -1, -0.4, 0.3, 1, 0.3, 0, 0, -Math.sin(legAngle * Math.PI / 180) * 20);
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      -1.2, -1, 0.4, 0.3, 1, 0.3, 0, 0, Math.sin(legAngle * Math.PI / 180) * 20);

    // --- Draw body and front parts pivoted at rear legs ---
    var bodyMatrix = new Matrix4();
    bodyMatrix.setIdentity();  // Start with identity matrix

    bodyMatrix.translate(0, -1, 0);               // Pivot at rear legs bottom
    bodyMatrix.rotate(-standAngle, 0, 0, -1);     // Tilt body forward/back/ -1 for clockwise
    bodyMatrix.translate(0, 1 + yOffset, 0);      // Adjust vertical position

    // Body
// gl                WebGL context, needed to draw anything
// u_ModelMatrix     Shader uniform location for the model matrix (local object transform)
// u_MvpMatrix       Shader uniform location for the Model-View-Projection matrix
// u_NormalMatrix    Shader uniform location for transforming normals (for lighting)
// vpMatrix          Combined view-projection matrix from camera
// 0, 0, 0           tx, ty, tz: translation of this cube in the world (X, Y, Z)
// 2, 1, 1           sx, sy, sz: scale of this cube (width, height, depth)
// 0, 0, 0           rx, ry, rz: rotation angles around X, Y, Z axes (in degrees)
// bodyMatrix        Optional parent matrix: applies the body’s transformation so this cube
//  
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      0, 0, 0, 2, 1, 1, 0, 0, 0, bodyMatrix);
    // Head
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      2.4, 0.3, 0, 0.6, 0.6, 0.6, 0, 0, 0, bodyMatrix);
    // Tail
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      -1.3, 0.5, 0, 0.3, 1, 0.3, 0, 0, 0, bodyMatrix);
    // Front legs
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      0.7, -1, -0.4, 0.3, 1, 0.3, 0, 0, Math.sin(legAngle * Math.PI / 180) * 20, bodyMatrix);
    drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
      0.7, -1, 0.4, 0.3, 1, 0.3, 0, 0, -Math.sin(legAngle * Math.PI / 180) * 20, bodyMatrix); 
//Using sine creates smooth periodic motion

    requestAnimationFrame(tick); // Loop the animation
  }
  tick(); // Start the animation loop
}

// --- Draw cube helper function ---
// tx, ty, tz: translation
// sx, sy, sz: scale
// rx, ry, rz: rotation in degrees
// parentMatrix: optional parent transformation
function drawCube(gl, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix, vpMatrix,
  tx, ty, tz, sx, sy, sz, rx, ry, rz, parentMatrix) {

  var modelMatrix = new Matrix4();
  if (parentMatrix) modelMatrix.set(parentMatrix); // Apply parent transformation if exists
  else modelMatrix.setIdentity();

  modelMatrix.translate(tx, ty, tz);  // Move cube
  modelMatrix.rotate(rx, 1, 0, 0);    // Rotate around X
  modelMatrix.rotate(ry, 0, 1, 0);    // Rotate around Y
  modelMatrix.rotate(rz, 0, 0, 1);    // Rotate around Z
  modelMatrix.scale(sx, sy, sz);      // Scale cube

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements); // Send to shader

  var mvpMatrix = new Matrix4();
  mvpMatrix.set(vpMatrix).multiply(modelMatrix); // Compute MVP
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix); // Normal transformation
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0); // Draw cube
}

// --- Vertex buffers initialization ---
function initVertexBuffers(gl) {
  var vertices = new Float32Array([
     // Vertices for cube (6 faces, 4 vertices per face)
     1,1,1,-1,1,1,-1,-1,1,1,-1,1,
     1,1,1,1,-1,1,1,-1,-1,1,1,-1,
     1,1,1,1,1,-1,-1,1,-1,-1,1,1,
    -1,1,1,-1,1,-1,-1,-1,-1,-1,-1,1,
    -1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,
     1,-1,-1,-1,-1,-1,-1,1,-1,1,1,-1
  ]);

  // Colors: simple pattern (red for demonstration)
  var colors = new Float32Array(Array(6*4*3).fill(0).map((v,i)=>i%3===0?1:0));

  // Normals: used for lighting
  var normals = new Float32Array([
    0,0,1,0,0,1,0,0,1,0,0,1,
    1,0,0,1,0,0,1,0,0,1,0,0,
    0,1,0,0,1,0,0,1,0,0,1,0,
    -1,0,0,-1,0,0,-1,0,0,-1,0,0,
    0,-1,0,0,-1,0,0,-1,0,0,-1,0,
    0,0,-1,0,0,-1,0,0,-1,0,0,-1
  ]);

  // Indices for drawing triangles
  var indices = new Uint8Array([
    0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,
    12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23
  ]);

  // Initialize vertex, color, and normal buffers
  if(!initArrayBuffer(gl,'a_Position',vertices,3,gl.FLOAT)) return -1;
  if(!initArrayBuffer(gl,'a_Color',colors,3,gl.FLOAT)) return -1;
  if(!initArrayBuffer(gl,'a_Normal',normals,3,gl.FLOAT)) return -1;

  // Create index buffer
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);

  return indices.length; // Number of indices to draw
}

// --- Helper to initialize a single array buffer ---
function initArrayBuffer(gl, attribute, data, num, type){
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  var a_attr = gl.getAttribLocation(gl.program, attribute); // Attribute location
  gl.vertexAttribPointer(a_attr,num,type,false,0,0);         // Describe buffer layout
  gl.enableVertexAttribArray(a_attr);                       // Enable attribute

  return true;
}
