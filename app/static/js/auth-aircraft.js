document.addEventListener("DOMContentLoaded", () => {
  const aircraft = document.querySelector(".auth-flight-image img");

  if (!aircraft) {
    return;
  }

  const recolorAircraft = () => {
    const canvas = document.createElement("canvas");
    canvas.width = aircraft.naturalWidth;
    canvas.height = aircraft.naturalHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(aircraft, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const isAircraft = red > green + 18 && green > blue + 8;

      if (!isAircraft) {
        pixels[index + 3] = 0;
        continue;
      }

      pixels[index] = 196;
      pixels[index + 1] = 154;
      pixels[index + 2] = 58;
      pixels[index + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    aircraft.src = canvas.toDataURL("image/png");
    aircraft.style.visibility = "visible";
  };

  aircraft.addEventListener("load", recolorAircraft, { once: true });
  aircraft.src = aircraft.dataset.source;
});
