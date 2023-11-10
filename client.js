// client.js

const socket = new WebSocket('ws://localhost:8080');

socket.onopen = function () {
  console.log('Connected to server');
};

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log('Received data:', data);
  if (data.urls) {
    displayURLs(data.urls);
  } else if (data.status === 'downloading') {
    updateDownloadStatus(data.fileName, data.totalSize);
    updateDownloadProgress(data.fileName, data.progress);
  } else if (data.status === 'completed') {
    displayDownloadedContent(data.fileName);
  } else if (data.status === 'error') {
    displayError(data.message);
  }
};

socket.onclose = function (event) {
  console.error('Socket closed unexpectedly:', event);
};

function getUrls() {
  const keyword = document.getElementById('keywordInput').value;
  socket.send(keyword);
}

document.getElementById('getUrlsButton').addEventListener('click', getUrls);

function displayURLs(urls) {
  console.log('Displaying URLs:', urls);
  const urlsList = document.getElementById('urlsList');
  urlsList.innerHTML = '';

  urls.forEach((url) => {
    const container = document.createElement('div');
    container.style.marginBottom = '10px';

    const link = document.createElement('a');
    link.setAttribute('target', '_blank');
    link.href = url;
    link.innerHTML = url;
    container.appendChild(link);

    const downloadButton = document.createElement('button');
    downloadButton.innerHTML = 'Open Image';
    container.appendChild(downloadButton);

    urlsList.appendChild(container);

    downloadButton.addEventListener('click', function () {
      downloadContent(url);
    });
  });
}

function downloadContent(url) {
  window.open(url, '_blank');
}

function updateDownloadStatus(fileName, totalSize) {
  const downloadStatus = document.getElementById('downloadStatus');
  downloadStatus.innerHTML = `Downloading ${fileName} - ${formatBytes(totalSize)}`;
}

function updateDownloadProgress(fileName, progress) {
  const downloadStatus = document.getElementById('downloadStatus');
  downloadStatus.innerHTML = `Downloading ${fileName} - ${progress.toFixed(2)}%`;
}

function displayDownloadedContent(fileName) {
  const downloadedList = document.getElementById('downloadedList');
  const link = document.createElement('a');
  link.href = `downloads/${fileName}`;
  link.target = '_blank';
  link.download = fileName;
  link.innerHTML = `You clicked on ${link.href}`;
  downloadedList.appendChild(link);
}

function displayError(message) {
  const urlsList = document.getElementById('urlsList');
  urlsList.innerHTML = '';

  const errorContainer = document.createElement('div');
  errorContainer.innerHTML = message;
  urlsList.appendChild(errorContainer);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)));
  return Math.round(100 * (bytes / Math.pow(k, i))) / 100 + ' ' + sizes[i];
}
