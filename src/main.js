import { zipSync } from 'fflate';

// Web Worker instance using Vite's native ES module syntax
const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module'
});

// App State (Single Mode)
let originalBuffer = null;
let originalWidth = null;
let originalHeight = null;
let originalName = "";
let originalUrl = null;
let compressedUrl = null;
let compressedBlob = null;
let isCompressing = false;
let compressionIdCounter = 0;
let currentCompressionId = null;

// App State (Batch Mode)
let isBatchMode = false;
let batchFiles = []; // Array of { file, buffer, name, size, width, height, format, compressedBuffer, compressedSize, status }
let batchCompressingIndex = 0;
let batchCompressionSessionId = 0;

// DOM Elements - General & Theme
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// DOM Elements - Single Mode Workspace
const editorContainer = document.getElementById('editor-container');
const resetBtn = document.getElementById('reset-btn');
const displayName = document.getElementById('display-name');
const imgOriginal = document.getElementById('img-original');
const imgCompressed = document.getElementById('img-compressed');
const sliderContainer = document.getElementById('slider-container');
const sliderOverlay = document.getElementById('slider-overlay');
const sliderHandle = document.getElementById('slider-handle');

// Single Mode Controls
const formatSelect = document.getElementById('format-select');
const qualityGroup = document.getElementById('quality-group');
const qualityRange = document.getElementById('quality-range');
const qualityVal = document.getElementById('quality-val');
const ratioLock = document.getElementById('ratio-lock');
const widthInput = document.getElementById('resize-width');
const heightInput = document.getElementById('resize-height');
const originalDimsBtn = document.getElementById('original-dims-btn');
const downloadBtn = document.getElementById('download-btn');
const statOrigSize = document.getElementById('stat-orig-size');
const statCompSize = document.getElementById('stat-comp-size');
const statSavings = document.getElementById('stat-savings');
const detailOrigRes = document.getElementById('detail-orig-res');
const detailCompRes = document.getElementById('detail-comp-res');
const detailFormat = document.getElementById('detail-format');

// DOM Elements - Batch Mode Workspace
const batchContainer = document.getElementById('batch-container');
const batchCount = document.getElementById('batch-count');
const batchResetBtn = document.getElementById('batch-reset-btn');
const batchQueue = document.getElementById('batch-queue');

// Batch Mode Controls
const batchFormatSelect = document.getElementById('batch-format-select');
const batchQualityGroup = document.getElementById('batch-quality-group');
const batchQualityRange = document.getElementById('batch-quality-range');
const batchQualityVal = document.getElementById('batch-quality-val');
const batchMaxWidth = document.getElementById('batch-max-width');
const batchMaxHeight = document.getElementById('batch-max-height');
const batchDownloadBtn = document.getElementById('batch-download-btn');

/* ---------------------------------------------------- */
/* Theme Controls                                       */
/* ---------------------------------------------------- */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

function updateThemeUI(theme) {
    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
});

initTheme();

/* ---------------------------------------------------- */
/* Upload Trigger Router (Single vs Batch)               */
/* ---------------------------------------------------- */
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
    }
});

fileInput.addEventListener('change', (e) => {
    handleUploadedFiles(e.target.files);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleUploadedFiles(e.dataTransfer.files);
    }
});

window.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            handleUploadedFiles([blob]);
            break;
        }
    }
});

function handleUploadedFiles(fileList) {
    if (fileList.length === 0) return;
    
    if (fileList.length === 1) {
        isBatchMode = false;
        loadFile(fileList[0]);
    } else {
        isBatchMode = true;
        loadBatchFiles(Array.from(fileList));
    }
}

/* ---------------------------------------------------- */
/* Single File Mode Pipeline                            */
/* ---------------------------------------------------- */
function showToast(message) {
    toastMessage.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

async function loadFile(file, fallbackName) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.');
        return;
    }

    originalName = file.name || fallbackName || 'image.jpg';
    displayName.textContent = originalName;
    loadingOverlay.style.display = 'flex';

    try {
        originalBuffer = await file.arrayBuffer();
        cleanPreviews();

        const blob = new Blob([originalBuffer], { type: file.type });
        originalUrl = URL.createObjectURL(blob);
        imgOriginal.src = originalUrl;

        const dimensions = await getImageDimensions(originalUrl);
        originalWidth = dimensions.width;
        originalHeight = dimensions.height;

        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        originalDimsBtn.style.display = 'inline-flex';
        sliderContainer.style.aspectRatio = `${originalWidth} / ${originalHeight}`;

        // Switch visible workspace
        dropZone.style.display = 'none';
        batchContainer.style.display = 'none';
        editorContainer.style.display = 'grid';

        statOrigSize.textContent = formatBytes(originalBuffer.byteLength);
        detailOrigRes.textContent = `${originalWidth} × ${originalHeight} px`;

        triggerCompression();
    } catch (err) {
        console.error(err);
        showToast(`Failed to load image: ${err.message || err}`);
        loadingOverlay.style.display = 'none';
    }
}

function getImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const tempImg = new Image();
        tempImg.onload = () => resolve({ width: tempImg.width, height: tempImg.height });
        tempImg.onerror = () => reject(new Error('Failed to resolve image dimensions'));
        tempImg.src = url;
    });
}

function cleanPreviews() {
    if (originalUrl) {
        URL.revokeObjectURL(originalUrl);
        originalUrl = null;
    }
    if (compressedUrl) {
        URL.revokeObjectURL(compressedUrl);
        compressedUrl = null;
    }
    imgOriginal.src = "";
    imgCompressed.src = "";
    compressedBlob = null;
}

resetBtn.addEventListener('click', () => {
    cleanPreviews();
    originalBuffer = null;
    originalWidth = null;
    originalHeight = null;
    originalName = "";
    editorContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    fileInput.value = "";
    widthInput.value = "";
    heightInput.value = "";
    originalDimsBtn.style.display = 'none';
});

function triggerCompression() {
    if (!originalBuffer || isBatchMode) return;

    isCompressing = true;
    loadingOverlay.style.display = 'flex';

    const compressionId = ++compressionIdCounter;
    currentCompressionId = compressionId;

    const targetFormat = formatSelect.value;
    const quality = parseInt(qualityRange.value, 10);
    const targetWidth = widthInput.value ? parseInt(widthInput.value, 10) : null;
    const targetHeight = heightInput.value ? parseInt(heightInput.value, 10) : null;

    const workBuffer = originalBuffer.slice(0);

    worker.postMessage({
        type: 'COMPRESS',
        id: compressionId,
        arrayBuffer: workBuffer,
        config: {
            format: targetFormat,
            quality: quality,
            width: targetWidth,
            height: targetHeight
        }
    }, [workBuffer]);
}

/* ---------------------------------------------------- */
/* Batch File Mode Pipeline                             */
/* ---------------------------------------------------- */
async function loadBatchFiles(files) {
    // Reset any old batch states
    batchFiles = [];
    batchQueue.innerHTML = "";
    batchDownloadBtn.disabled = true;
    
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
        showToast('Please select valid image files.');
        return;
    }

    loadingOverlay.style.display = 'flex';
    batchCount.textContent = imageFiles.length;

    try {
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const buffer = await file.arrayBuffer();
            
            // Create a temp object URL to resolve dimensions
            const tempBlob = new Blob([buffer], { type: file.type });
            const tempUrl = URL.createObjectURL(tempBlob);
            const dims = await getImageDimensions(tempUrl);
            URL.revokeObjectURL(tempUrl);

            batchFiles.push({
                file: file,
                buffer: buffer,
                name: file.name,
                size: file.size,
                width: dims.width,
                height: dims.height,
                compressedBuffer: null,
                compressedSize: null,
                status: 'pending', // pending, processing, completed, failed
                format: 'webp'
            });

            // Append item row to list DOM
            appendQueueRow(file.name, file.size, i);
        }

        // Switch workspace display
        dropZone.style.display = 'none';
        editorContainer.style.display = 'none';
        batchContainer.style.display = 'grid';

        // Trigger batch compression
        triggerBatchCompression();

    } catch (err) {
        console.error(err);
        showToast(`Failed to parse batch files: ${err.message || err}`);
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function appendQueueRow(name, size, index) {
    const row = document.createElement('div');
    row.className = 'queue-item';
    row.id = `queue-row-${index}`;
    row.innerHTML = `
        <div class="queue-details">
            <div class="queue-name">${name}</div>
            <div class="queue-sizes">
                <span class="orig-size-label">${formatBytes(size)}</span>
                <span class="comp-size-label" style="display: none;"></span>
                <span class="savings-badge text-success" style="display: none;"></span>
            </div>
        </div>
        <div class="queue-status">
            <span class="status-badge status-pending" id="status-badge-${index}">Pending</span>
        </div>
    `;
    batchQueue.appendChild(row);
}

function triggerBatchCompression() {
    if (batchFiles.length === 0) return;
    
    batchCompressionSessionId++;
    batchCompressingIndex = 0;
    batchDownloadBtn.disabled = true;

    compressNextBatchItem();
}

function compressNextBatchItem() {
    if (batchCompressingIndex >= batchFiles.length) {
        // Complete! Enable batch download
        batchDownloadBtn.disabled = false;
        showToast('Batch compression completed successfully!');
        return;
    }

    const item = batchFiles[batchCompressingIndex];
    item.status = 'processing';
    
    // Update Badge UI
    const badge = document.getElementById(`status-badge-${batchCompressingIndex}`);
    badge.textContent = 'Processing';
    badge.className = 'status-badge status-processing';

    // Calculate dimensions based on bounding constraints
    const maxW = batchMaxWidth.value ? parseInt(batchMaxWidth.value, 10) : null;
    const maxH = batchMaxHeight.value ? parseInt(batchMaxHeight.value, 10) : null;
    const dims = calculateBoundingDimensions(item.width, item.height, maxW, maxH);

    const targetFormat = batchFormatSelect.value;
    const quality = parseInt(batchQualityRange.value, 10);
    item.format = targetFormat;

    const workBuffer = item.buffer.slice(0);

    // Send payload to worker
    worker.postMessage({
        type: 'COMPRESS',
        id: `batch-${batchCompressionSessionId}-${batchCompressingIndex}`,
        arrayBuffer: workBuffer,
        config: {
            format: targetFormat,
            quality: quality,
            width: dims.width,
            height: dims.height
        }
    }, [workBuffer]);
}

function calculateBoundingDimensions(origW, origH, maxW, maxH) {
    if (!maxW && !maxH) return { width: null, height: null };
    
    let ratioW = maxW ? maxW / origW : 1;
    let ratioH = maxH ? maxH / origH : 1;
    let ratio = Math.min(ratioW, ratioH);

    // Prevent upscaling smaller images
    if (ratio >= 1) return { width: null, height: null };

    return {
        width: Math.max(1, Math.round(origW * ratio)),
        height: Math.max(1, Math.round(origH * ratio))
    };
}

batchResetBtn.addEventListener('click', () => {
    batchFiles = [];
    batchQueue.innerHTML = "";
    batchContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    fileInput.value = "";
});

/* ---------------------------------------------------- */
/* Worker Messages Dispatcher Router                     */
/* ---------------------------------------------------- */
worker.onmessage = (e) => {
    const { type, id, arrayBuffer, stats, error } = e.data;

    // Route Single Image compression messages
    if (typeof id === 'number') {
        if (id !== currentCompressionId) return;
        isCompressing = false;
        loadingOverlay.style.display = 'none';

        if (type === 'COMPRESS_SUCCESS') {
            const mimeType = getMimeType(stats.format);
            compressedBlob = new Blob([arrayBuffer], { type: mimeType });

            if (compressedUrl) URL.revokeObjectURL(compressedUrl);
            compressedUrl = URL.createObjectURL(compressedBlob);
            imgCompressed.src = compressedUrl;

            statCompSize.textContent = formatBytes(stats.compressedSize);
            const savings = Math.round(((stats.originalSize - stats.compressedSize) / stats.originalSize) * 100);
            statSavings.textContent = savings > 0 ? `${savings}%` : `0%`;

            const activeWidth = widthInput.value || originalWidth;
            const activeHeight = heightInput.value || originalHeight;
            detailCompRes.textContent = `${activeWidth} × ${activeHeight} px`;
            detailFormat.textContent = stats.format.toUpperCase();
        } else if (type === 'COMPRESS_ERROR') {
            showToast(`Compression failed: ${error}`);
        }
        return;
    }

    // Route Batch Queue compression messages
    if (typeof id === 'string' && id.startsWith('batch-')) {
        const parts = id.split('-');
        const sessionId = parseInt(parts[1], 10);
        const index = parseInt(parts[2], 10);

        if (sessionId !== batchCompressionSessionId) return;

        const item = batchFiles[index];
        const badge = document.getElementById(`status-badge-${index}`);
        const row = document.getElementById(`queue-row-${index}`);

        if (type === 'COMPRESS_SUCCESS') {
            item.status = 'completed';
            item.compressedBuffer = arrayBuffer;
            item.compressedSize = stats.compressedSize;

            // Update row view stats
            badge.textContent = 'Done';
            badge.className = 'status-badge status-completed';

            const compLabel = row.querySelector('.comp-size-label');
            const savingsBadge = row.querySelector('.savings-badge');
            
            compLabel.textContent = ` → ${formatBytes(stats.compressedSize)}`;
            compLabel.style.display = 'inline';

            const savingsVal = Math.round(((item.size - stats.compressedSize) / item.size) * 100);
            savingsBadge.textContent = savingsVal > 0 ? `(${savingsVal}% saved)` : `(0% saved)`;
            savingsBadge.style.display = 'inline';

        } else if (type === 'COMPRESS_ERROR') {
            item.status = 'failed';
            badge.textContent = 'Error';
            badge.className = 'status-badge status-failed';
            console.error(`Batch compression error on index ${index}: ${error}`);
        }

        // Proceed to next item in the batch queue
        batchCompressingIndex++;
        compressNextBatchItem();
    }
};

/* ---------------------------------------------------- */
/* Batch Control Event Bindings                         */
/* ---------------------------------------------------- */
batchFormatSelect.addEventListener('change', (e) => {
    if (e.target.value === 'png') {
        batchQualityGroup.style.display = 'none';
    } else {
        batchQualityGroup.style.display = 'flex';
    }
    triggerBatchCompression();
});

batchQualityRange.addEventListener('input', (e) => {
    batchQualityVal.textContent = `${e.target.value}%`;
});

batchQualityRange.addEventListener('change', () => {
    triggerBatchCompression();
});

batchMaxWidth.addEventListener('change', triggerBatchCompression);
batchMaxHeight.addEventListener('change', triggerBatchCompression);

// Download ZIP
batchDownloadBtn.addEventListener('click', () => {
    if (batchFiles.length === 0) return;

    loadingOverlay.style.display = 'flex';
    setTimeout(() => {
        try {
            const zipFilesObj = {};
            batchFiles.forEach(item => {
                if (item.status === 'completed' && item.compressedBuffer) {
                    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
                    const finalExt = item.format;
                    const finalFilename = `${baseName}-compressed.${finalExt}`;
                    zipFilesObj[finalFilename] = new Uint8Array(item.compressedBuffer);
                }
            });

            // Generate ZIP buffer client-side using fflate
            const zipBuffer = zipSync(zipFilesObj);
            const zipBlob = new Blob([zipBuffer], { type: 'application/zip' });
            const zipUrl = URL.createObjectURL(zipBlob);

            const downloadLink = document.createElement('a');
            downloadLink.href = zipUrl;
            downloadLink.download = 'compressed-images.zip';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(zipUrl);

        } catch (err) {
            console.error(err);
            showToast(`Failed to generate ZIP archive: ${err.message || err}`);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }, 100);
});

/* ---------------------------------------------------- */
/* Single Settings Controls & Comparison Slider         */
/* ---------------------------------------------------- */
formatSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'png') {
        qualityGroup.style.display = 'none';
    } else {
        qualityGroup.style.display = 'flex';
    }
    triggerCompression();
});

qualityRange.addEventListener('input', (e) => {
    qualityVal.textContent = `${e.target.value}%`;
});

qualityRange.addEventListener('change', () => {
    triggerCompression();
});

widthInput.addEventListener('input', () => {
    if (!originalWidth) return;
    if (ratioLock.checked && widthInput.value) {
        const w = parseInt(widthInput.value, 10);
        heightInput.value = Math.max(1, Math.round((originalHeight * w) / originalWidth));
    }
});

heightInput.addEventListener('input', () => {
    if (!originalHeight) return;
    if (ratioLock.checked && heightInput.value) {
        const h = parseInt(heightInput.value, 10);
        widthInput.value = Math.max(1, Math.round((originalWidth * h) / originalHeight));
    }
});

widthInput.addEventListener('change', triggerCompression);
heightInput.addEventListener('change', triggerCompression);

originalDimsBtn.addEventListener('click', () => {
    if (!originalWidth) return;
    widthInput.value = originalWidth;
    heightInput.value = originalHeight;
    triggerCompression();
});

// Single Comparison Slider events
let isDraggingSlider = false;
let sliderPercentage = 50;

function updateSliderSplit(clientX) {
    const rect = sliderContainer.getBoundingClientRect();
    if (rect.width === 0) return;
    let positionX = clientX - rect.left;
    positionX = Math.max(0, Math.min(positionX, rect.width));

    sliderPercentage = (positionX / rect.width) * 100;
    applySliderSplit(sliderPercentage);
}

function applySliderSplit(percentage) {
    sliderOverlay.style.width = `${percentage}%`;
    sliderHandle.style.left = `${percentage}%`;
    sliderContainer.setAttribute('aria-valuenow', Math.round(percentage));
}

sliderContainer.addEventListener('mousedown', (e) => {
    isDraggingSlider = true;
    updateSliderSplit(e.clientX);
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingSlider) return;
    updateSliderSplit(e.clientX);
});

window.addEventListener('mouseup', () => {
    isDraggingSlider = false;
});

sliderContainer.addEventListener('touchstart', (e) => {
    isDraggingSlider = true;
    if (e.touches.length > 0) {
        updateSliderSplit(e.touches[0].clientX);
    }
});

window.addEventListener('touchmove', (e) => {
    if (!isDraggingSlider) return;
    if (e.touches.length > 0) {
        updateSliderSplit(e.touches[0].clientX);
    }
});

window.addEventListener('touchend', () => {
    isDraggingSlider = false;
});

sliderContainer.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sliderPercentage = Math.max(0, sliderPercentage - 5);
        applySliderSplit(sliderPercentage);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sliderPercentage = Math.min(100, sliderPercentage + 5);
        applySliderSplit(sliderPercentage);
    }
});

// Download Single Image
downloadBtn.addEventListener('click', () => {
    if (!compressedBlob) return;

    const extension = formatSelect.value;
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const finalName = `${baseName}-compressed.${extension}`;

    const link = document.createElement('a');
    link.href = compressedUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

/* ---------------------------------------------------- */
/* Utility Helpers                                      */
/* ---------------------------------------------------- */
function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getMimeType(format) {
    switch (format.toLowerCase()) {
        case 'png': return 'image/png';
        case 'webp': return 'image/webp';
        case 'jpeg':
        case 'jpg':
        default:
            return 'image/jpeg';
    }
}

/* ---------------------------------------------------- */
/* Service Worker Registration & PWA Install Prompts    */
/* ---------------------------------------------------- */
const installBtn = document.getElementById('install-btn');
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser install menu banner
    e.preventDefault();
    deferredPrompt = e;
    // Show PWA install button in header action toolbar
    installBtn.style.display = 'inline-flex';
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation choice outcome: ${outcome}`);
    deferredPrompt = null;
    installBtn.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
    console.log('SleekCompress PWA successfully installed!');
    installBtn.style.display = 'none';
});

// Register SW only in non-local environments or if supported
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                console.log('ServiceWorker registered with scope: ', reg.scope);
            })
            .catch((err) => {
                console.warn('ServiceWorker registration failed: ', err);
            });
    });
}

