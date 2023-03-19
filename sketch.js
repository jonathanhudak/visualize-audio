let audioData = [];

const PATH_TO_AUDIO_FILES = "./audio-files";

const audioFiles = [
  "AcidHOOS.mp3",
  //   "AcidHOOS.wav",
  "Amber Syrup.mp3",
  //   "Amber Syrup.wav",
  "Every Breath.mp3",
  //   "Every Breath.wav",
  "GrooveA.mp3",
  //   "GrooveA.wav",
  "HAUNT.mp3",
  //   "HAUNT.wav",
  //   "ImageOfLife.wav",
  //   "Let it go.wav",
  //   "MindZ.wav",
  "Other Side.mp3",
  //   "Other Side.wav",
  "Theodore",
  "View.mp3",
  //   "View.wav",
];

function createAudioElements({ generateSongColor }) {
  return audioFiles.map((file, i) => {
    let audioElement = createElement("audio");
    audioElement.id("audio-element-" + i);
    audioElement.attribute("controls", "");

    const audioContainer = document.getElementById("audio-container");

    // audioContainer.styles.backgroundColor = generateSongColor();

    const fileContainer = createElement("div");
    const songColor = generateSongColor();
    fileContainer.elt.setAttribute("class", "file-container");
    fileContainer.elt.setAttribute("songColor", songColor);
    fileContainer.style("background-color", songColor);

    fileContainer.parent(audioContainer);

    let h2 = createElement("h2");
    h2.html(file);
    h2.parent(audioElement);

    h2.parent(fileContainer);

    let sourceElement = createElement("source");
    sourceElement.attribute("src", songColor);
    sourceElement.attribute("src", `${PATH_TO_AUDIO_FILES}/${audioFiles[i]}`);
    sourceElement.attribute("type", "audio/" + audioFiles[i].split(".").pop());
    sourceElement.parent(audioElement);

    audioElement.parent(fileContainer);

    return audioElement;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  const generateSongColor = () => color(random(255), random(255), random(255));

  let audioElements = createAudioElements({
    generateSongColor,
  });

  let audioContext = new (window.AudioContext || window.webkitAudioContext)();

  for (let el of audioElements) {
    let audioElement = select("#" + el.elt.id);
    const songColor =
      audioElement.elt.getAttribute("songColor") ||
      color(random(255), random(255), random(255));

    let audioSource = audioContext.createMediaElementSource(audioElement.elt);
    let fft = audioContext.createAnalyser();
    fft.fftSize = 1024;

    audioSource.connect(fft);
    fft.connect(audioContext.destination);

    audioData.push({
      audioElement: audioElement,
      fft: fft,
      color: songColor, // Create a random p5.js color object
    });

    // Add event listeners for play and pause events
    // Add event listeners for play and pause events
    // Add event listeners for play and pause events
    audioElement.elt.addEventListener("play", () => {
      // Pause all other audio elements
      for (let data of audioData) {
        if (data.audioElement.elt !== audioElement.elt) {
          data.audioElement.elt.pause();
        }
      }
    });
  }
}
function drawWaveform(fft, waveColor, scale) {
  let numPoints = fft.frequencyBinCount;
  let waveform = new Float32Array(numPoints);
  fft.getFloatTimeDomainData(waveform);

  let angleStep = TWO_PI / numPoints;

  push();
  translate(width / 2, height / 2);

  // Scale the waveform
  scale *= width / 4;

  // Draw the first point and the point before that to start the shape smoothly
  let angleFirst = 0;
  let xFirst = cos(angleFirst) * (1 + waveform[0]) * scale;
  let yFirst = sin(angleFirst) * (1 + waveform[0]) * scale;

  let angleLast = (numPoints - 1) * angleStep;
  let xLast = cos(angleLast) * (1 + waveform[numPoints - 1]) * scale;
  let yLast = sin(angleLast) * (1 + waveform[numPoints - 1]) * scale;

  curveVertex(xLast, yLast);
  curveVertex(xFirst, yFirst);

  for (let i = 0; i < numPoints; i++) {
    let angle = i * angleStep;
    let x = cos(angle) * (1 + waveform[i]) * scale;
    let y = sin(angle) * (1 + waveform[i]) * scale;

    curveVertex(x, y);
  }

  // Draw the last point and the point after that to close the shape smoothly
  curveVertex(xFirst, yFirst);
  curveVertex(xLast, yLast);

  endShape(CLOSE);
  pop();
}

function draw() {
  background(30);

  for (let data of audioData) {
    if (!data.audioElement.elt.paused && !data.audioElement.elt.ended) {
      stroke(data.color);
      noFill();

      // Calculate the scale based on the frequency values
      let freqValues = new Uint8Array(data.fft.frequencyBinCount);
      data.fft.getByteFrequencyData(freqValues);
      let avgFreq = freqValues.reduce((a, b) => a + b) / freqValues.length;
      let scale = map(avgFreq, 0, 255, 0.3, 1.3);

      beginShape();
      drawWaveform(data.fft, data.color, scale);
      endShape(CLOSE);
    }
  }
}
