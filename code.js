var timeDomainCanvas;	
var frequencyCanvas;	
var visualizationCanvas;	
var audioContext;
var audioSource;
var analyser;
var frequencyData; 						
var timeDomainData;

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
});

function initScene() {
	// TO DO
}

function initWebGL(vertexShaderCode, fragmentShaderCode) {
	// TO DO
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
	// TO DO
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
