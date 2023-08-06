document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    const context = canvas.getContext('2d');
  
    let pixelSize = 20;
    let numRows = 100;
    let numCols = 100;
    let canvasWidth = numCols * pixelSize;
    let canvasHeight = numRows * pixelSize;
    const pixelData = createPixelData();
  
    let currentColor = 'black';
    let isDrawing = false;
    let isErasing = false;
  
    let isPanning = false;
    let lastMouseX;
    let lastMouseY;
  
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    document.body.appendChild(canvas);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', enableZoom);
    canvas.addEventListener('mouseleave', disableZoom);
  
    const colorDivs = document.querySelectorAll('.color');
    colorDivs.forEach(colorDiv => colorDiv.addEventListener('click', changeColor));
  
    function createPixelData() {
      const data = [];
      for (let i = 0; i < numRows; i++) {
        const row = [];
        for (let j = 0; j < numCols; j++) {
          row.push('transparent');
        }
        data.push(row);
      }
      return data;
    }

    function savePixels() {
        const pixelsToSave = [];
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numCols; j++) {
            if (pixelData[i][j] !== 'transparent') {
              pixelsToSave.push({ row: i, col: j, color: pixelData[i][j] });
            }
          }
        }
    }
      
    function loadPixels() {
      fetch('http://localhost:3000/api/pixels')
        .then((response) => response.json())
        .then((data) => {
          if (data.length === 0) {
            // La base de datos está vacía, borrar todos los pixeles del pixelData
            for (let i = 0; i < numRows; i++) {
              for (let j = 0; j < numCols; j++) {
                pixelData[i][j] = 'transparent';
              }
            }
          } else {
            // La base de datos no está vacía, cargar los pixeles desde el servidor
            data.forEach((pixel) => {
              pixelData[pixel.row][pixel.col] = pixel.color;
            });
          }
          drawCanvas(); // Dibujar el canvas después de cargar los pixeles
        })
        .catch((error) => console.error('Error:', error));
    }
  
    function drawCanvas() {
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numCols; j++) {
          const color = pixelData[i][j];
          if (color !== 'transparent') {
            context.fillStyle = color;
            context.fillRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }

    function drawPixel(e) {
  
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const offsetX = (e.clientX - rect.left) * scaleX;
      const offsetY = (e.clientY - rect.top) * scaleY;
  
      const col = Math.floor(offsetX / pixelSize);
      const row = Math.floor(offsetY / pixelSize);
  
      pixelData[row][col] = currentColor;
  
      // Resto del código existente
      drawCanvas();
      savePixels(); // Llamar a la función savePixels para guardar el pixel pintado
    }
      
    function handleMouseDown(e) {
      if (e.button === 0) {
        isDrawing = true;
        drawPixel(e);
      } else if (e.button === 2) {
        isPanning = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    }
  
    function handleMouseUp() {
      isDrawing = false;
      isPanning = false;
    }
  
    function handleMouseMove(e) {
      if (isDrawing) {
        drawPixel(e);
      } else if (isPanning) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        window.scrollBy(-deltaX, -deltaY);
      }
    }
  
    function changeColor(event) {
      currentColor = event.target.style.backgroundColor;
      isErasing = currentColor === 'transparent';
    }
  
    const mural = document.getElementById('canvas');
    let zoom = 1.0;
    const zoomStep = 0.1;
  
    function zoomMural(event) {
      const zoomDirection = event.deltaY > 0 ? -1 : 1;
      zoom += zoomDirection * zoomStep;
      zoom = Math.min(2.0, Math.max(0.5, zoom));
      mural.style.transformOrigin = 'center';
      mural.style.transform = `scale(${zoom})`;
      event.preventDefault();
    }
  
    function enableZoom() {
      window.addEventListener('wheel', zoomMural);
    }
  
    function disableZoom() {
      window.removeEventListener('wheel', zoomMural);
    }
  
    function smoothScrollTo(x, y) {
      const startX = window.scrollX;
      const startY = window.scrollY;
      const distanceX = x - startX;
      const distanceY = y - startY;
      const step = 20; // Controla la suavidad del desplazamiento
      let currentStep = 0;
  
      function scroll() {
        currentStep++;
        const fraction = currentStep / step;
        const offsetX = startX + distanceX * fraction;
        const offsetY = startY + distanceY * fraction;
        window.scrollTo(offsetX, offsetY);
  
        if (currentStep < step) {
          requestAnimationFrame(scroll);
        }
      }
  
      scroll();
    }
  
    function handleMouseAtEdge(e) {
      const threshold = 20;
      const { clientX, clientY } = e;
  
      if (clientY < threshold) {
        // Desplazamiento hacia arriba
        smoothScrollTo(window.scrollX, window.scrollY - pixelSize);
      } else if (clientY > window.innerHeight - threshold) {
        // Desplazamiento hacia abajo
        smoothScrollTo(window.scrollX, window.scrollY + pixelSize);
      }
  
      if (clientX < threshold) {
        // Desplazamiento hacia la izquierda
        smoothScrollTo(window.scrollX - pixelSize, window.scrollY);
      } else if (clientX > window.innerWidth - threshold) {
        // Desplazamiento hacia la derecha
        smoothScrollTo(window.scrollX + pixelSize, window.scrollY);
      }
    }
  
    document.addEventListener('mousemove', handleMouseAtEdge);
  
    drawCanvas();
    loadPixels();
});
  