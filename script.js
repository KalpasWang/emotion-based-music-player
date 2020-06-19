const webcam = document.getElementById('webcam');
const player = document.getElementById('player');
const playBtn = document.getElementById('play');

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  // faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)
// faceapi.nets.tinyFaceDetector.loadFromUri('/models').then(startVideo)

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
  .then(stream => webcam.srcObject = stream)
  .catch(err => console.error(err))
}

webcam.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(webcam)
  document.body.append(canvas)
  const displaySize = { width: webcam.clientWidth, height: webcam.clientHeight }
  faceapi.matchDimensions(canvas, displaySize)

  setInterval(async () => {
    const detections = await faceapi.detectSingleFace(webcam, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    if (detections) {
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }
    
  }, 200)
});

playBtn.addEventListener('click', () => {
  // play click sound effect when entering play music mode
  const clickAudio = new Audio('audio/click.mp3');
  clickAudio.play();

  // replace the original view in player
  const template = `
  <div class="flex justify-center items-center w-full h-full">
    <canvas id="waveform" class="h-32 mx-auto mt-10"></canvas>
  </div>`;
  player.innerHTML = template;


  const audio = new Audio('audio/rock.mp3');
  // audio.controls = true;
  // audio.loop = true;
  audio.autoplay = true;

  const audioContext = new AudioContext(); // AudioContext object instance
  const analyser = audioContext.createAnalyser(); // AnalyserNode method
  const waveCanvas = document.getElementById('waveform');
  const canvasContext = waveCanvas.getContext('2d');
  waveCanvas.width = webcam.clientWidth;
  // canvas.height = webcam.clientHeight;

  // Re-route audio playback into the processing graph of the AudioContext
  const source = audioContext.createMediaElementSource(audio); 
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  frameLooper();

  function frameLooper(){
    window.requestAnimationFrame(frameLooper);
    let fbc_array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fbc_array);
    canvasContext.clearRect(0, 0, waveCanvas.width, waveCanvas.height); // Clear the canvas
    canvasContext.fillStyle = 'rgba(0, 205, 255, 0.75)';//'#00CCFF'; // Color of the bars
    // console.log(fbc_array);

    const bars = 100;
    const bar_width = waveCanvas.width / bars;
    for (let i = 0; i < bars; i++) {
      let bar_x = i * bar_width;
      let amplitude = fbc_array[i];
      let bar_height = -(amplitude / 2);
      //  fillRect( x, y, width, height ) // Explanation of the parameters below
      canvasContext.fillRect(bar_x, waveCanvas.height, bar_width, bar_height);
    }
  }

  // Establish all variables that your Analyser will use
  // var canvas, ctx, source, context, analyser, fbc_array, bars, bar_x, bar_width, bar_height;
  // // Initialize the MP3 player after the page loads all of its HTML into the window
  // window.addEventListener("load", initMp3Player, false);
  // function initMp3Player(){
  //   document.getElementById('audio_box').appendChild(audio);
  //   context = new AudioContext(); // AudioContext object instance
  //   analyser = context.createAnalyser(); // AnalyserNode method
  //   canvas = document.getElementById('analyser_render');
  //   ctx = canvas.getContext('2d');
  //   // Re-route audio playback into the processing graph of the AudioContext
  //   source = context.createMediaElementSource(audio); 
  //   source.connect(analyser);
  //   analyser.connect(context.destination);
  //   frameLooper();
  // }
  // // frameLooper() animates any style of graphics you wish to the audio frequency
  // // Looping at the default frame rate that the browser provides(approx. 60 FPS)
  // function frameLooper(){
  //   window.requestAnimationFrame(frameLooper);
  //   fbc_array = new Uint8Array(analyser.frequencyBinCount);
  //   analyser.getByteFrequencyData(fbc_array);
  //   ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  //   ctx.fillStyle = '#00CCFF'; // Color of the bars
  //   bars = 100;
  //   for (var i = 0; i < bars; i++) {
  //     bar_x = i * 3;
  //     bar_width = 2;
  //     bar_height = -(fbc_array[i] / 2);
  //     //  fillRect( x, y, width, height ) // Explanation of the parameters below
  //     ctx.fillRect(bar_x, canvas.height, bar_width, bar_height);
  //   }
  // }
});