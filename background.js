chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'downloadImages') {
    const urls = message.urls;
    const batchSize = 10;
    let completed = 0;

    function generateRandomLetters(length = 5) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      return result;
    }

    function downloadBatch(startIndex) {
      const endIndex = Math.min(startIndex + batchSize, urls.length);
      const batch = urls.slice(startIndex, endIndex);

      Promise.all(batch.map((url, index) => {
        return new Promise((resolve, reject) => {
          const randomSuffix = generateRandomLetters();
          chrome.downloads.download({
            url: url,
            filename: `image_${startIndex + index + 1}_${randomSuffix}.jpg`,
            conflictAction: 'uniquify'
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              console.error(`下载失败: ${url}, 错误: ${chrome.runtime.lastError.message}`);
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      })).then(() => {
        completed += batch.length;
        chrome.runtime.sendMessage({type: 'downloadProgress', completed, total: urls.length});
        if (endIndex < urls.length) {
          downloadBatch(endIndex);
        } else {
          sendResponse({status: '所有下载完成'});
        }
      }).catch(error => {
        console.error('批次下载出错:', error);
      });
    }

    if (urls.length > 0) {
      downloadBatch(0);
    } else {
      sendResponse({status: '无图片可下载'});
    }
    return true;
  }
});
