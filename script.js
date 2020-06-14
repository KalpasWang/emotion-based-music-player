const webcam = document.getElementById('webcam')

// Promise.all([
//   faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
//   faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
//   faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
//   faceapi.nets.faceExpressionNet.loadFromUri('/models')
// ]).then(startVideo)
faceapi.nets.tinyFaceDetector.loadFromUri('/models').then(startVideo)

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
    const detections = await faceapi.detectSingleFace(webcam, new faceapi.TinyFaceDetectorOptions())//.withFaceLandmarks().withFaceExpressions()

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    if (detections) {
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      faceapi.draw.drawDetections(canvas, resizedDetections)
    }
    
    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 100)
})