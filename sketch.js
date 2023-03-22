let audioData = [];

const PATH_TO_AUDIO_FILES = "./audio-files";

const audioFiles = [
  "AcidHOOS.mp3",
  "Amber Syrup.mp3",
  // "GrooveA.mp3",
  "HAUNT.mp3",
  "Light of Attention.wav",
  // "Other Side.mp3",
];

function generateRandomLCHColorAndComplement() {
  const lchColor = chroma.random("lch");
  const complement = chroma(lchColor).set(
    "lch.h",
    (lchColor.get("lch.h") + 180) % 360
  );

  return {
    lchColor: lchColor,
    complement: complement,
  };
}

function createAudioElements() {
  return audioFiles.map((file, i) => {
    const audioElement = createElement("audio");
    audioElement.id("audio-element-" + i);
    let lchColor;
    let complement;
    function randomizeColorPalette() {
      ({ lchColor, complement } = generateRandomLCHColorAndComplement());
      audioElement.attribute("controls", "");
      audioElement.attribute("data-song-color", lchColor);
      audioElement.attribute("data-song-color-complement", complement);
    }
    randomizeColorPalette();

    const audioContainer = document.getElementById("audio-container");
    const fileContainer = createElement("div");

    const regeneratePaletteButton = createElement("button");
    regeneratePaletteButton.html("Regenerate Palette");
    regeneratePaletteButton.parent(fileContainer);
    regeneratePaletteButton.mousePressed(randomizeColorPalette);

    fileContainer.elt.classList.add("file-container");
    fileContainer.style("background-color", lchColor);

    fileContainer.parent(audioContainer);

    const h2 = createElement("h2");
    h2.html(file);
    h2.parent(audioElement);

    h2.parent(fileContainer);

    const sourceElement = createElement("source");
    sourceElement.attribute("src", `${PATH_TO_AUDIO_FILES}/${audioFiles[i]}`);
    sourceElement.attribute("type", "audio/" + audioFiles[i].split(".").pop());
    sourceElement.parent(audioElement);

    audioElement.parent(fileContainer);

    return audioElement;
  });
}

function onAttributesChange(mutationList) {
  for (const mutation of mutationList) {
    if (mutation.type === "attributes") {
      const targetId = mutation.target.id;
      const newSongColor = mutation.target.getAttribute("data-song-color");
      const newSongColorComplement = mutation.target.getAttribute(
        "data-song-color-complement"
      );

      // Update the corresponding audioData object
      for (let data of audioData) {
        if (data.audioElement.elt.id === targetId) {
          data.color = newSongColor;
          data.colorComplemenet = newSongColorComplement;
          break;
        }
      }
    }
  }
}
function setup() {
  createCanvas(windowWidth, windowHeight);
  const generateSongColor = () => color(random(255), random(255), random(255));

  const audioElements = createAudioElements({
    generateSongColor,
  });

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const observer = new MutationObserver(onAttributesChange);

  for (const el of audioElements) {
    const audioElement = select("#" + el.elt.id);
    const songColor = audioElement.elt.getAttribute("data-song-color");
    const songColorComplement = audioElement.elt.getAttribute(
      "data-song-color-complement"
    );

    const audioSource = audioContext.createMediaElementSource(audioElement.elt);
    const fft = audioContext.createAnalyser();
    fft.fftSize = 1024;

    audioSource.connect(fft);
    fft.connect(audioContext.destination);

    audioData.push({
      audioElement: audioElement,
      fft: fft,
      color: songColor,
      colorComplemenet: songColorComplement,
    });

    // Add event listeners for play and pause events
    audioElement.elt.addEventListener("play", () => {
      // Pause all other audio elements
      for (let data of audioData) {
        if (data.audioElement.elt !== audioElement.elt) {
          data.audioElement.elt.pause();
        }
      }
    });

    // Observe changes to data-song-color and data-song-color-complement attributes
    observer.observe(audioElement.elt, {
      attributes: true,
      attributeFilter: ["data-song-color", "data-song-color-complement"],
    });
  }
}

function drawWaveform(fft, waveColor, scale) {
  const numPoints = fft.frequencyBinCount;
  const waveform = new Float32Array(numPoints);
  fft.getFloatTimeDomainData(waveform);

  const angleStep = TWO_PI / numPoints;

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
  for (let data of audioData) {
    if (!data.audioElement.elt.paused && !data.audioElement.elt.ended) {
      background(data.colorComplemenet);
      stroke(data.color);
      fill(data.color);

      const numPoints = data.fft.frequencyBinCount;
      const waveform = new Float32Array(numPoints);

      // Calculate the scale based on the frequency values
      const freqValues = new Uint8Array(data.fft.frequencyBinCount);
      data.fft.getByteFrequencyData(freqValues);
      const avgFreq = freqValues.reduce((a, b) => a + b) / freqValues.length;
      const freqScale = map(avgFreq, 0, 255, 0.2, 3.0);

      // Calculate the average amplitude
      const avgAmplitude =
        waveform.reduce((a, b) => a + Math.abs(b)) / numPoints;

      // Map the average amplitude to the desired scale range
      const ampScale = map(avgAmplitude, 0, 1, 0.15, 1.0);

      beginShape();
      drawWaveform(data.fft, data.color, freqScale);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
