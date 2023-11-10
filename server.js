const fs = require('fs').promises;
const WebSocket = require('ws');
const path = require('path');

const keywords = {
  'Alaska': [
    'https://images.pexels.com/photos/5389947/pexels-photo-5389947.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/207049/pexels-photo-207049.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/6779240/pexels-photo-6779240.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ],
  'South Carolina': [
    'https://images.pexels.com/photos/18933841/pexels-photo-18933841.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/3996433/pexels-photo-3996433.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/18969425/pexels-photo-18969425.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ],
  'California': [
    'https://images.pexels.com/photos/745236/pexels-photo-745236.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/2401665/pexels-photo-2401665.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1006964/pexels-photo-1006964.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  ],
  // Другие ключевые слова с соответствующими URL
};

let MAX_CONCURRENT_THREADS = 1;
fs.readFile('config.txt', 'utf8')
  .then(data => {
    MAX_CONCURRENT_THREADS = Number(data);
    console.log('MAX_CONCURRENT_THREADS set to', MAX_CONCURRENT_THREADS);
  })
  .catch(error => {
    console.error('Failed to read config.txt:', error);
  });

const server = new WebSocket.Server({ port: 8080 });

const downloadStatus = {
  status: '',
  fileName: '',
  totalSize: 0,
  downloadedSize: 0,
  progress: 0,
};

server.on('connection', (socket) => {
  console.log('Client connected');
  let threadCount = 0;

  socket.on('message', async (message) => {
    console.log(`Received message: ${message}`);
    const urls = keywords[message];

    if (urls) {
      socket.send(JSON.stringify({ status: 'fetching', urls }));
    } else {
      socket.send(JSON.stringify({ status: 'error', message: 'No links found for this keyword' }));
    }
  });

  function sendDownloadStatus() {
    socket.send(JSON.stringify({
      status: 'downloading',
      message: downloadStatus.status,
      fileName: downloadStatus.fileName,
      totalSize: downloadStatus.totalSize,
      progress: downloadStatus.progress,
    }));
  }

  function sendDownloadComplete() {
    socket.send(JSON.stringify({
      status: 'completed',
      message: 'Download complete',
      fileName: downloadStatus.fileName,
    }));
  }

  async function downloadContent(url) {
    console.log('Downloading content:', url);

    downloadStatus.status = 'Downloading';
    downloadStatus.fileName = url;
    downloadStatus.totalSize = 0;
    downloadStatus.downloadedSize = 0;
    downloadStatus.progress = 0;

    sendDownloadStatus();

    try {
      const data = await download(url);

      downloadStatus.status = 'Completed';
      downloadStatus.totalSize = data.length;
      downloadStatus.downloadedSize = data.length;
      downloadStatus.progress = 100;

      sendDownloadStatus();
      sendDownloadComplete();

      const fileNameSegments = url.split('/');
      const fileName = fileNameSegments[fileNameSegments.length - 1];
      const filePath = path.join(__dirname, 'downloads', fileName);
      await fs.writeFile(filePath, data);
    } catch (error) {
      console.error('Error occurred during download:', error);
      socket.send(JSON.stringify({ status: 'error', message: 'Error occurred during download' }));
    }
  }

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log("Server started on port 8080");

// Функция загрузки данных (вам нужно реализовать свою собственную)
async function download(url) {
  // Замените этот блок кода на вашу собственную логику загрузки данных
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onloadstart = function () {
      console.log('Download started');
    };

    xhr.onprogress = function (event) {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        downloadStatus.progress = progress;
        sendDownloadStatus();
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(new Uint8Array(xhr.response));
      } else {
        reject(xhr.status);
      }
    };

    xhr.onerror = function () {
      reject('Error occurred during download');
    };

    xhr.send();
  });
}
