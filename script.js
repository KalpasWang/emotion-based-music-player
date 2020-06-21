const webcam = document.getElementById('webcam');
const player = document.getElementById('player');
const playBtn = document.getElementById('play');
const emotionEnum = {
    angry: 0,
    happy: 1,
    sad: 2,
    surprised: 3
  };
// const ANGRY = 0;
// const HAPPY = 1;
// const SAD = 2;
// const SURPRISED = 3;
let prevDetection = null;

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
  const canvas = faceapi.createCanvasFromMedia(webcam);
  document.body.append(canvas);
  const displaySize = { width: webcam.clientWidth, height: webcam.clientHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detection = await faceapi.detectSingleFace(webcam, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    // console.log(detection);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    if (detection) {
      const resizedDetections = faceapi.resizeResults(detection, displaySize)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      const expression = detectExpression(detection);
      console.log(expression);
      if(Number.isInteger(expression)) {
        const emotionsDiv = document.getElementById('emotions');
        if(emotionsDiv === undefined) return;
        emotionsDiv.children[expression].classList.add('bg-blue-500', 'bg-opacity-75');
      }
    }
  }, 200)
});

function detectExpression(detection) {
  const emotions = [];

  emotions[0] = detection.expressions['angry'] || 0;
  emotions[1] = detection.expressions['happy'] || 0;
  emotions[2] = detection.expressions['sad'] || 0;
  emotions[3] = detection.expressions['surprised'] || 0;

  const maxNumIdx = emotions.reduce((maxNumIdx, num, idx, arr) => {
      if(num > 0 && num > arr[maxNumIdx]) {
        return idx;
      }
      return maxNumIdx;
    }, 0);

  if(emotions[maxNumIdx] == 0) {
    prevDetection = null;
    return;
  }

  for(let [k, v] of Object.entries(detection.expressions)) {
    if(v > emotions[maxNumIdx] && emotionEnum[k] !== undefined) {
      prevDetection = null;
      return;
    }
  }
  
  if(maxNumIdx === prevDetection) {
    return maxNumIdx
  } else {
    prevDetection = maxNumIdx;
  }
}

playBtn.addEventListener('click', () => {
  // play click sound effect when entering play music mode
  const clickAudio = new Audio('audio/click.mp3');
  clickAudio.play();

  // replace the original view in player
  const template = `
  <div class="flex justify-center items-end w-full h-full">
    <canvas id="waveform" class="h-32 mx-auto"></canvas>
    <div id="emotions" class="flex justify-center items-stretch w-full h-32 text-3xl">
      <div class="mx-3 border-solid border-2 border-gray-300 rounded-md">
        <i class="fas fa-volume-down"></i> 😡
      </div>
      <div class="mx-3 border-solid border-2 border-gray-300 rounded-md">
        <i class="fas fa-volume-up"></i> 😄
      </div>
      <div class="mx-3 border-solid border-2 border-gray-300 rounded-md">
        <i class="far fa-pause-circle"></i> 😥
      </div>
      <div class="mx-3 border-solid border-2 border-gray-300 rounded-md">
        <i class="far fa-times-circle"></i> 😲
      </div>
    </div>
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
});