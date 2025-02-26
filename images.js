document.addEventListener('DOMContentLoaded', () => {
  const imageContainer = document.getElementById('imageContainer');
  const showSelectedUrlsButton = document.getElementById('showSelectedUrls');
  const showAllUrlsButton = document.getElementById('showAllUrls');
  const downloadSelectedButton = document.getElementById('downloadSelected');
  const downloadAllButton = document.getElementById('downloadAll');
  const widthFilter = document.getElementById('widthFilter');
  const heightFilter = document.getElementById('heightFilter');
  const filterButton = document.getElementById('filterButton');
  const progressDiv = document.getElementById('progress');
  const imageCountDiv = document.getElementById('imageCount'); // 用于显示图片总数和剩余数
  let images = [];
  let filteredImages = [];
  let sourceTabId = null;

  // 初始化，获取源标签页 ID
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'init') {
      sourceTabId = message.sourceTabId;
    } else if (message.type === 'images' && sender.tab.id === sourceTabId) {
      updateImages(message.data);
    } else if (message.type === 'downloadProgress') {
      updateProgress(message.completed, message.total);
    }
  });

  function updateImages(newImages) {
    const uniqueImages = newImages.filter(newImg => 
      !images.some(img => img.src === newImg.src)
    );
    images = [...images, ...uniqueImages];
    applyFilter();
  }

  function applyFilter() {
    const minWidth = parseInt(widthFilter.value) || 0;
    const minHeight = parseInt(heightFilter.value) || 0;
  
    // 使用 AND (&&) 确保同时满足宽度和高度的条件
    filteredImages = images.filter(img => 
      img.width >= minWidth && img.height >= minHeight
    );
    
    displayImages(); // 显示过滤后的图片
  }
  
  function displayImages() {
    imageContainer.innerHTML = '';  // 清空现有图片
    filteredImages.forEach((img, index) => {
      const div = document.createElement('div');
      div.className = 'image-item';
      div.dataset.index = index;
      div.innerHTML = `<img src="${img.src}" alt="${img.alt}"><br>${img.width}x${img.height}`;
      
      div.addEventListener('click', () => {
        div.classList.toggle('selected');
        updateImageCount();  // 更新选中的图片数
      });

      // 添加删除按钮
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '删除';
      deleteButton.className = 'delete-button';
      deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // 防止触发图片选择的点击事件
        deleteImage(index); // 删除图片
      });
      
      div.appendChild(deleteButton);
      imageContainer.appendChild(div);
    });

    updateImageCount();  // 更新总数和剩余数
  }

  // 更新图片数量
  function updateImageCount() {
    const totalImages = filteredImages.length;
    const selectedImages = document.querySelectorAll('.image-item.selected').length;
    imageCountDiv.textContent = `总图片数: ${totalImages}，剩余图片数: ${totalImages - selectedImages}`;
  }

  // // 删除图片
  // function deleteImage(index) {
  //   // 从 filteredImages 数组中移除对应的图片
  //   filteredImages.splice(index, 1);
    
  //   // 重新应用过滤器，确保删除后页面更新
  //   applyFilter();
  // }

  function deleteImage(index) {
    const imageToDelete = filteredImages[index];
  
    // 找到原始 images 数组中的索引并删除
    const originalIndex = images.findIndex(img => img.src === imageToDelete.src);
    if (originalIndex !== -1) {
      images.splice(originalIndex, 1);  // 从原始数据中删除
    }
  
    applyFilter(); // 重新应用过滤器并刷新 UI
  }
  

  // 更新下载进度
  function updateProgress(completed, total) {
    progressDiv.textContent = `下载进度: ${completed}/${total} (${Math.round((completed / total) * 100)}%)`;
    if (completed === total) {
      setTimeout(() => {
        progressDiv.textContent = '下载完成';
      }, 1000);
    }
  }

  // 过滤功能
  filterButton.addEventListener('click', () => {
    applyFilter();
  });

  // URL 转换函数
  function convertUrl(url) {
    if (url.endsWith('?format=jpg&name=240x240')) {
      return url.replace('?format=jpg&name=240x240', '?format=jpg&name=4096x4096');
    } else if (url.endsWith('?format=jpg&name=small')) {
      return url.replace('?format=jpg&name=small', '?format=jpg&name=large');
    } else if (url.endsWith('.jpg')) {
      return url.replace('.jpg', '?format=jpg&name=4096x4096');
    }
    return url;
  }

  // 提取选中图片地址
  showSelectedUrlsButton.addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('.image-item.selected');
    if (selectedItems.length === 0) {
      alert('请先选择至少一张图片');
      return;
    }

    const selectedImages = Array.from(selectedItems).map(item => {
      const index = item.dataset.index;
      return filteredImages[index];
    });

    const urlList = selectedImages.map(img => `${img.alt}: ${convertUrl(img.src)}`).join('\n');
    showPopup(urlList);
  });

  // 提取所有图片地址
  showAllUrlsButton.addEventListener('click', () => {
    if (filteredImages.length === 0) {
      alert('当前没有符合条件的图片');
      return;
    }

    const urlList = filteredImages.map(img => `${img.alt}: ${convertUrl(img.src)}`).join('\n');
    showPopup(urlList);
  });

  // 下载选中图片
  downloadSelectedButton.addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('.image-item.selected');
    if (selectedItems.length === 0) {
      alert('请先选择至少一张图片');
      return;
    }

    const selectedImages = Array.from(selectedItems).map(item => {
      const index = item.dataset.index;
      return filteredImages[index];
    });

    const urls = selectedImages.map(img => convertUrl(img.src));
    progressDiv.textContent = '开始下载...';
    chrome.runtime.sendMessage({
      type: 'downloadImages',
      urls: urls
    }, (response) => {
      console.log(response.status);
    });
  });

  // 下载所有图片
  downloadAllButton.addEventListener('click', () => {
    if (filteredImages.length === 0) {
      alert('当前没有符合条件的图片');
      return;
    }

    const urls = filteredImages.map(img => convertUrl(img.src));
    progressDiv.textContent = '开始下载...';
    chrome.runtime.sendMessage({
      type: 'downloadImages',
      urls: urls
    }, (response) => {
      console.log(response.status);
    });
  });

  // 显示弹窗
  function showPopup(urlList) {
    const popup = window.open('', '图片地址', 'width=400,height=300');
    popup.document.write(
      `<pre>${urlList}</pre>
      <button onclick="window.close()">关闭</button>`
    );
  }
});
