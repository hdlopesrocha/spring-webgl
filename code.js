var timeDomainCanvas;	
var frequencyCanvas;	
var visualizationCanvas;	
var audioContext;
var audioSource;
var analyser;
var frequencyData; 						
var timeDomainData;
var gl;
var shaderProgram;
var projectionMatrix;
var viewMatrix;
var modelMatrix;
var projectionMatrixLocation;
var viewMatrixLocation;
var modelMatrixLocation;
var positionLocation;
var cameraPositionLocation;
var cameraPosition;
var lightDirectionLocation;
var lightDirection;
var amplitudeLocation;
var frequencyLocation;
var timeLocation;
var indicesLength;

$(document).ready(function() {
	timeDomainCanvas = document.getElementById("timeDomain");
	frequencyCanvas = document.getElementById("frequency");
	visualizationCanvas = document.getElementById("visualization");

	$("#myFile").change(function (event){
		var file = $(this)[0].files[0];
		if (file) {
			var reader = new FileReader();
			reader.readAsArrayBuffer(file);
			reader.onload = function(e) {
				playSound(e.target.result);
			};
		}
	});

  var vertCode = $("#vertexShader").html();
  var fragCode = $("#fragmentShader").html();

  download( "libs/simplex.glsl", function( simplex ) {
    initWebGL(vertCode.replace('#include<libs/noise>',simplex), fragCode);
    initScene();
    loop(0);
  });
});

function initScene() {
  // get shader locations
  projectionMatrixLocation = gl.getUniformLocation(shaderProgram, "projectionMatrix");
  viewMatrixLocation = gl.getUniformLocation(shaderProgram, "viewMatrix");
  modelMatrixLocation = gl.getUniformLocation(shaderProgram, "modelMatrix");
  positionLocation = gl.getAttribLocation(shaderProgram, "position");
  amplitudeLocation = gl.getUniformLocation(shaderProgram, "amplitude");
  frequencyLocation = gl.getUniformLocation(shaderProgram, "frequency");
  timeLocation = gl.getUniformLocation(shaderProgram, "time");
  cameraPositionLocation = gl.getUniformLocation(shaderProgram, "cameraPosition");
  lightDirectionLocation = gl.getUniformLocation(shaderProgram, "lightDirection");

  gl.useProgram(shaderProgram);

  // initialize shader variables
  projectionMatrix = createProjectionMatrix(45, visualizationCanvas.width/visualizationCanvas.height, 0.1, 100);
  viewMatrix = createIdentityMatrix();
  modelMatrix = createIdentityMatrix();

  // init vertices and indices
  var vertices = [];
  var indices = [];
  var length = 32;

  for(var i=0; i < length; ++i) {
    for(var j=0; j < length; ++j) {
      // x, y, z
      vertices.push(i/length);
      vertices.push(j/length);
    }
  }

  for(var i=0; i < length - 1; ++i) {
    for(var j=0; j < length - 1; ++j) {
      // first triangle
      indices.push((j+0) + (i+0)*length);
      indices.push((j+0) + (i+1)*length);
      indices.push((j+1) + (i+0)*length);
      // second triangle
      indices.push((j+1) + (i+1)*length);
      indices.push((j+1) + (i+0)*length);
      indices.push((j+0) + (i+1)*length);
    }
  }

  // create vertex buffer
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0) ;
  gl.enableVertexAttribArray(positionLocation);

  // create index buffer
  var indexBuffer = gl.createBuffer ();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  indicesLength = indices.length;
}

function initWebGL(vertexShaderCode, fragmentShaderCode) {
  gl = visualizationCanvas.getContext('webgl');

  // compile vertex shader
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertexShaderCode);
  gl.compileShader(vertShader);
  console.log(gl.getShaderInfoLog(vertShader));

  // compile fragment shader
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragmentShaderCode);
  gl.compileShader(fragShader);
  console.log(gl.getShaderInfoLog(fragShader));

  // link shaders
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
}

function playSound(data) {
	audioContext = new AudioContext();
	audioSource = audioContext.createBufferSource(); 
	analyser = audioContext.createAnalyser();
	analyser.fftSize = 512;
	audioSource.connect(analyser).connect(audioContext.destination); 
	
	audioContext.decodeAudioData(data, function(buffer) {
		audioSource.buffer = buffer;
		audioSource.start(0);
	});

	frequencyData = new Uint8Array(analyser.frequencyBinCount); 						
	timeDomainData = new Uint8Array(analyser.frequencyBinCount);

	$("#myFile").remove();
}

function draw(time) {
	if(frequencyData) {
		analyser.getByteFrequencyData(frequencyData);
		drawArray(time, frequencyCanvas, frequencyData);
	}
	if(timeDomainData){
		analyser.getByteTimeDomainData(timeDomainData);
		drawArray(time, timeDomainCanvas, timeDomainData);
	}
	drawVisualization(time);
}

function drawVisualization(time) {
  cameraPosition = [0.5,-0.4,0.5];
  lightDirection = [Math.sin(time), Math.cos(time), -4];

  viewMatrix = createLookAtMatrix(cameraPosition, [0.5,0.5,0], [0,0,1]);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);

  gl.viewport(0.0, 0.0, visualizationCanvas.width, visualizationCanvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
  gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
  gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);
  gl.uniform3fv(cameraPositionLocation, cameraPosition);
  gl.uniform3fv(lightDirectionLocation, lightDirection);
  gl.uniform1f(timeLocation ,time);

  if(frequencyData){
    gl.uniform1iv(frequencyLocation ,frequencyData);
  }
  if(timeDomainData){
    gl.uniform1iv(amplitudeLocation, timeDomainData);
  }
  gl.drawElements(gl.LINES, indicesLength, gl.UNSIGNED_SHORT, 0);
}

function drawArray(time, canvas, array) {
	var canvasContext = canvas.getContext("2d");
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);  
	canvasContext.beginPath();
	canvasContext.lineWidth = 2;
	canvasContext.strokeStyle = '#fff';

	var first = true;
	for (var i=0; i < array.length; ++i) {
		var x = (i/array.length)*canvas.width;
		var y = (array[i]/255)*canvas.height;
		if (first) {
			first = false;
			canvasContext.moveTo(x, canvas.height-y);
		} else {
			canvasContext.lineTo(x, canvas.height-y);
		}
	}
	canvasContext.stroke();
}
