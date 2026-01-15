import React, { useState, useRef, useCallback } from "react";
import "./ImageConverter.css";

// Target dimensions for bitmap output
const TARGET_WIDTH = 320;
const TARGET_HEIGHT = 480;

const ImageConverter = ({ onBack }) => {
  const [originalImage, setOriginalImage] = useState(null);
  const [convertedImage, setConvertedImage] = useState(null);
  const [bmpBlob, setBmpBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: false,
    sepia: false,
    invert: false,
    warmth: 0, // -100 to 100 (cool to warm)
  });
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setConvertedImage(null);
      setBmpBlob(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: false,
      sepia: false,
      invert: false,
      warmth: 0,
    });
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Apply filters to image data
  const applyFilters = useCallback((data) => {
    const { brightness, contrast, saturation, grayscale, sepia, invert, warmth } = filters;
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      if (brightness !== 100) {
        const factor = brightness / 100;
        r *= factor;
        g *= factor;
        b *= factor;
      }

      // Contrast
      if (contrast !== 100) {
        const factor = (contrast / 100);
        r = ((r / 255 - 0.5) * factor + 0.5) * 255;
        g = ((g / 255 - 0.5) * factor + 0.5) * 255;
        b = ((b / 255 - 0.5) * factor + 0.5) * 255;
      }

      // Saturation
      if (saturation !== 100) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const factor = saturation / 100;
        r = gray + factor * (r - gray);
        g = gray + factor * (g - gray);
        b = gray + factor * (b - gray);
      }

      // Warmth (color temperature)
      if (warmth !== 0) {
        const factor = warmth / 100;
        r += factor * 30;
        b -= factor * 30;
      }

      // Grayscale
      if (grayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }

      // Sepia
      if (sepia) {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = tr;
        g = tg;
        b = tb;
      }

      // Invert
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  }, [filters]);

  // Convert canvas ImageData to BMP file format
  const createBmpBlob = useCallback((imageData, width, height) => {
    const rowSize = Math.ceil((width * 3) / 4) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // BMP File Header (14 bytes)
    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4D); // 'M'
    view.setUint32(2, fileSize, true);
    view.setUint32(6, 0, true);
    view.setUint32(10, 54, true);

    // DIB Header (BITMAPINFOHEADER - 40 bytes)
    view.setUint32(14, 40, true);
    view.setInt32(18, width, true);
    view.setInt32(22, height, true);
    view.setUint16(26, 1, true);
    view.setUint16(28, 24, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true);
    view.setInt32(42, 2835, true);
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    // Pixel data (BGR format, bottom-up)
    const data = imageData.data;
    for (let y = height - 1; y >= 0; y--) {
      const rowStart = 54 + (height - 1 - y) * rowSize;
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = rowStart + x * 3;
        view.setUint8(dstIdx, data[srcIdx + 2]); // B
        view.setUint8(dstIdx + 1, data[srcIdx + 1]); // G
        view.setUint8(dstIdx + 2, data[srcIdx]); // R
      }
    }

    return new Blob([buffer], { type: "image/bmp" });
  }, []);

  const convertToBitmap = useCallback(() => {
    if (!originalImage) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas to target size: 320×480
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      // Calculate scaling to cover the target area (crop to fit)
      const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (TARGET_WIDTH - scaledWidth) / 2;
      const offsetY = (TARGET_HEIGHT - scaledHeight) / 2;

      // Fill with white background first
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Draw and resize image to fit 320×480
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Get image data
      const imageData = ctx.getImageData(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // Apply filters
      applyFilters(imageData.data);

      // Put filtered image back
      ctx.putImageData(imageData, 0, 0);

      // Create BMP blob for download
      const blob = createBmpBlob(imageData, TARGET_WIDTH, TARGET_HEIGHT);
      setBmpBlob(blob);

      // Create preview image (PNG for display)
      setConvertedImage(canvas.toDataURL("image/png"));
      setIsProcessing(false);
    };
    img.src = originalImage;
  }, [originalImage, createBmpBlob, applyFilters]);

  const downloadImage = useCallback(() => {
    if (!bmpBlob) return;
    const link = document.createElement("a");
    link.download = "image_320x480.bmp";
    link.href = URL.createObjectURL(bmpBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [bmpBlob]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target.result);
        setConvertedImage(null);
        setBmpBlob(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div className="image-converter">
      <header className="converter-header">
        <button className="back-btn" onClick={onBack} title="Back to todos">
          <i className="fa-solid fa-arrow-left" aria-hidden></i>
        </button>
        <h2 className="converter-title">Image → Bitmap (320×480)</h2>
      </header>

      <div className="converter-content">
        {/* Info Badge */}
        <div className="info-badge">
          <i className="fa-solid fa-info-circle"></i>
          Output: 320×480 pixels, BMP format
        </div>

        {/* Upload Area */}
        <div
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {originalImage ? (
            <img src={originalImage} alt="Original" className="preview-image" />
          ) : (
            <div className="upload-placeholder">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <p>Drop an image or click to upload</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            hidden
          />
        </div>

        {/* Filter Controls */}
        <div className="filter-section">
          <div className="filter-header">
            <h3><i className="fa-solid fa-sliders"></i> Filters</h3>
            <button className="reset-btn" onClick={resetFilters} title="Reset filters">
              <i className="fa-solid fa-rotate-left"></i> Reset
            </button>
          </div>

          {/* Slider Filters */}
          <div className="filter-sliders">
            <div className="filter-control">
              <label>
                <i className="fa-solid fa-sun"></i> Brightness: {filters.brightness}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.brightness}
                onChange={(e) => updateFilter("brightness", Number(e.target.value))}
              />
            </div>

            <div className="filter-control">
              <label>
                <i className="fa-solid fa-circle-half-stroke"></i> Contrast: {filters.contrast}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.contrast}
                onChange={(e) => updateFilter("contrast", Number(e.target.value))}
              />
            </div>

            <div className="filter-control">
              <label>
                <i className="fa-solid fa-palette"></i> Saturation: {filters.saturation}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={filters.saturation}
                onChange={(e) => updateFilter("saturation", Number(e.target.value))}
              />
            </div>

            <div className="filter-control">
              <label>
                <i className="fa-solid fa-temperature-half"></i> Warmth: {filters.warmth > 0 ? `+${filters.warmth}` : filters.warmth}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={filters.warmth}
                onChange={(e) => updateFilter("warmth", Number(e.target.value))}
              />
            </div>
          </div>

          {/* Toggle Filters */}
          <div className="filter-toggles">
            <button
              className={`toggle-btn ${filters.grayscale ? "active" : ""}`}
              onClick={() => updateFilter("grayscale", !filters.grayscale)}
            >
              <i className="fa-solid fa-droplet"></i> Grayscale
            </button>

            <button
              className={`toggle-btn ${filters.sepia ? "active" : ""}`}
              onClick={() => updateFilter("sepia", !filters.sepia)}
            >
              <i className="fa-solid fa-image"></i> Sepia
            </button>

            <button
              className={`toggle-btn ${filters.invert ? "active" : ""}`}
              onClick={() => updateFilter("invert", !filters.invert)}
            >
              <i className="fa-solid fa-circle-half-stroke"></i> Invert
            </button>
          </div>
        </div>

        {/* Convert Button */}
        <button
          className="convert-btn"
          onClick={convertToBitmap}
          disabled={!originalImage || isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Processing...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i> Convert to 320×480 BMP
            </>
          )}
        </button>

        {/* Result */}
        {convertedImage && (
          <div className="result-area">
            <h3>Result (320×480)</h3>
            <img src={convertedImage} alt="Converted" className="result-image" />
            <button className="download-btn" onClick={downloadImage}>
              <i className="fa-solid fa-download"></i> Download BMP
            </button>
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export default ImageConverter;
