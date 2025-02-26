// 获取页面上的所有图片 
function getImages() {
  const images = document.getElementsByTagName('img');
  const imageUrls = [];

  Array.from(images).forEach(img => {
    const src = img.src.toLowerCase();
    // 只处理不是 .svg 格式的图片
    if (src.endsWith('.svg')) return;

    // 确保图片加载完成后才获取尺寸
    if (img.complete) {
      // 图片已加载，直接获取尺寸
      imageUrls.push({
        src: img.src,
        alt: img.alt || '无描述',
        width: img.naturalWidth,  // 获取图片实际宽度
        height: img.naturalHeight // 获取图片实际高度
      });
    } else {
      // 如果图片没有加载完成，监听加载完成事件
      img.onload = () => {
        imageUrls.push({
          src: img.src,
          alt: img.alt || '无描述',
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
    }
  });

  return imageUrls;
}

// 发送图片数据的函数
function sendImageData() {
  const images = getImages();

  // 如果图片数据不为空，发送消息
  if (images.length > 0) {
    chrome.runtime.sendMessage({
      type: 'images',
      data: images
    }, (response) => {
      // 错误处理
      if (chrome.runtime.lastError) {
        console.error('发送消息失败:', chrome.runtime.lastError.message);
      } else {
        console.log('图片数据已发送:', response);
      }
    });
  } else {
    console.warn('没有图片数据，未发送消息');
  }
}

// 初始加载时发送图片
sendImageData();

// 实时监控 DOM 变化，检测图片的增加或更新
const observer = new MutationObserver(() => {
  sendImageData(); // 触发图片数据发送
});

// 开始监听 body 内部的 DOM 变化
observer.observe(document.body, {
  childList: true,
  subtree: true
});
