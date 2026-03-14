// =========================
// 1. 获取页面元素
// =========================
const kw = document.getElementById("kw");
const searchForm = document.getElementById("searchForm");
const searchBtn = document.getElementById("searchBtn");
const tips = document.getElementById("tips");
const stopBtn = document.getElementById("stopBtn");
const outputPanel = document.getElementById("outputPanel");
const shareUrl = document.getElementById("shareUrl");
const copyBtn = document.getElementById("copyBtn");
const previewBtn = document.getElementById("previewBtn");
const guide = document.getElementById("guide");

// 保存所有定时器，方便中途停止
const timeouts = [];
let typingTimer = null;

// 当前是否处于演示模式
let tutorialQuery = null;

// =========================
// 2. 编码 / 解码函数
// =========================
function encodeQuery(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeQuery(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (err) {
    return "";
  }
}

function getQueryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  return q ? decodeQuery(q) : "";
}

function buildShareLink(question) {
  const url = new URL(window.location.href);
  url.searchParams.set("q", encodeQuery(question));
  return url.toString();
}

// =========================
// 3. 工具函数
// =========================
function setTips(text) {
  tips.textContent = text;
}

function addTimeout(fn, delay) {
  const id = setTimeout(fn, delay);
  timeouts.push(id);
  return id;
}

function clearAllTimers() {
  while (timeouts.length) {
    clearTimeout(timeouts.pop());
  }
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
}

function moveGuideToElement(el) {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2 + window.scrollX;
  const y = rect.top + rect.height / 2 + window.scrollY;

  guide.style.left = x + "px";
  guide.style.top = y + "px";
  guide.style.display = "block";
}

function guidePulse() {
  guide.classList.remove("active");
  void guide.offsetWidth; // 强制刷新，让动画可重复触发
  guide.classList.add("active");
}

function hideGuide() {
  guide.style.display = "none";
  guide.classList.remove("active");
}

// =========================
// 4. 提交表单：生成分享链接
// =========================
searchForm.addEventListener("submit", function (e) {
  e.preventDefault();

  // 演示模式下，不允许正常提交
  if (tutorialQuery) return;

  const question = kw.value.trim();

  if (!question) {
    setTips("先输入一点内容喵~");
    kw.focus();
    return;
  }

  const link = buildShareLink(question);
  shareUrl.value = link;
  outputPanel.style.display = "block";
  setTips("↓↓↓ 复制下面的链接，发给不会百度的人");
  shareUrl.focus();
  shareUrl.select();
});

// =========================
// 5. 复制链接
// =========================
copyBtn.addEventListener("click", async function () {
  const text = shareUrl.value.trim();

  if (!text) {
    setTips("还没有可复制的链接哦");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      shareUrl.focus();
      shareUrl.select();
      document.execCommand("copy");
    }
    setTips("复制成功！");
  } catch (err) {
    setTips("复制失败，请手动复制");
  }
});

// =========================
// 6. 预览链接
// =========================
previewBtn.addEventListener("click", function () {
  const text = shareUrl.value.trim();

  if (!text) {
    setTips("还没有可预览的链接哦");
    return;
  }

  window.open(text, "_blank");
});

// =========================
// 7. 停止演示
// =========================
stopBtn.addEventListener("click", function () {
  clearAllTimers();
  hideGuide();
  stopBtn.style.display = "none";

  kw.value = tutorialQuery || "";
  tutorialQuery = null;
  setTips("输入一个问题，然后点击百度一下");
});

// =========================
// 8. 自动演示逻辑
// =========================

function showGuideAt(x = 20, y = 20) {
  guide.style.left = x + "px";
  guide.style.top = y + "px";
  guide.classList.add("show");
}

function hideGuide() {
  guide.classList.remove("show");
}

function moveGuideToElement(el, duration = 800) {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  guide.style.transition =
    `left ${duration}ms cubic-bezier(0.22, 1, 0.36, 1),
     top ${duration}ms cubic-bezier(0.22, 1, 0.36, 1),
     opacity 0.25s ease,
     transform 0.2s ease`;

  guide.style.left = x + "px";
  guide.style.top = y + "px";
}

function guideClick() {
  guide.classList.remove("clicking");
  void guide.offsetWidth; // 强制重绘，确保重复点击动画能触发
  guide.classList.add("clicking");

  setTimeout(() => {
    guide.classList.remove("clicking");
  }, 220);
}

function clickElementWithGuide(el, afterClick) {
  moveGuideToElement(el, 800);

  addTimeout(() => {
    guideClick();

    // 让目标元素获得真实点击感
    if (typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }

    addTimeout(() => {
      if (afterClick) afterClick();
    }, 220);
  }, 850);
}

function keepCaretAtEnd(input) {
  const pos = input.value.length;
  input.focus({ preventScroll: true });
  input.setSelectionRange(pos, pos);
}

function startTutorial(query) {
  tutorialQuery = query;
  stopBtn.style.display = "block";
  setTips("让我来教你正确的打开方式");

  // 先从左上角出现
  showGuideAt(20, 20);

  addTimeout(() => {
    setTips("1、找到输入框并选中");

    clickElementWithGuide(kw, () => {
      setTips("2、输入你要找的内容");

      let i = 0;
      kw.value = "";
      keepCaretAtEnd(kw);

      typingTimer = setInterval(() => {
        kw.value = query.slice(0, i);
        keepCaretAtEnd(kw);
        i++;

        if (i > query.length) {
          clearInterval(typingTimer);
          typingTimer = null;

          addTimeout(() => {
            setTips("3、点击下“百度一下”按钮");

            clickElementWithGuide(searchBtn, () => {
              setTips("对你而言就是这么困难吗...");

              addTimeout(() => {
                const target =
                  "https://www.baidu.com/s?ie=utf-8&wd=" +
                  encodeURIComponent(query);
                window.location.href = target;
              }, 1000);
            });
          }, 350);
        }
      }, 140);
    });
  }, 600);
}
// =========================
// 9. 页面初始化
// =========================
window.addEventListener("DOMContentLoaded", function () {
  const q = getQueryFromUrl();
  if (q) {
    startTutorial(q);
  }
});
