/**
 * AI 文本总结工具 - 前端逻辑
 */

// 配置
const API_BASE = 'http://localhost:8000/api';

// DOM 元素
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const clearBtn = document.getElementById('clearBtn');
const summarizeBtn = document.getElementById('summarizeBtn');
const resultSection = document.getElementById('resultSection');
const summaryText = document.getElementById('summaryText');
const keywordsContainer = document.getElementById('keywordsContainer');
const originalLength = document.getElementById('originalLength');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const errorToast = document.getElementById('errorToast');
const errorMessage = document.getElementById('errorMessage');
const successToast = document.getElementById('successToast');

// 状态
let isLoading = false;
let currentFileName = null;  // 记录当前文件名
const MAX_HISTORY = 5;       // 最多保存 5 条历史

/**
 * 从 localStorage 读取历史记录
 */
function getHistory() {
    try {
        const data = localStorage.getItem('summary_history');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * 保存历史记录到 localStorage
 */
function saveHistory(history) {
    try {
        localStorage.setItem('summary_history', JSON.stringify(history));
    } catch (e) {
        // 忽略存储错误
    }
}

/**
 * 添加一条历史记录
 */
function addHistory(text, summary, keywords, mode) {
    const history = getHistory();
    const record = {
        id: Date.now(),
        text: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
        summary,
        keywords,
        mode,
        time: new Date().toLocaleString('zh-CN')
    };
    history.unshift(record);
    if (history.length > MAX_HISTORY) {
        history.pop();
    }
    saveHistory(history);
    renderHistory();
}

/**
 * 渲染历史记录列表
 */
function renderHistory() {
    const container = document.getElementById('historyList');
    const countEl = document.getElementById('historyCount');
    if (!container) return;

    const history = getHistory();
    if (countEl) {
        countEl.textContent = history.length > 0 ? `(${history.length})` : '';
    }
    if (history.length === 0) {
        container.innerHTML = '<div class="history-empty">暂无历史记录</div>';
        return;
    }

    container.innerHTML = history.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-meta">${item.mode === 'brief' ? '⚡简短' : '📝普通'} · ${item.time}</div>
            <div class="history-text">${item.text}</div>
            <div class="history-summary">${item.summary}</div>
        </div>
    `).join('');

    // 点击加载历史
    container.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            const id = parseInt(el.dataset.id);
            const record = history.find(h => h.id === id);
            if (record) {
                textInput.value = record.text.endsWith('...') ? '' : record.text;
                // 找到对应模式
                const modeRadio = document.querySelector(`input[name="mode"][value="${record.mode}"]`);
                if (modeRadio) modeRadio.checked = true;
                // 渲染结果
                renderResult({
                    summary: record.summary,
                    keywords: record.keywords,
                    word_count: record.text.length
                });
            }
        });
    });
}

/**
 * 显示错误提示
 */
function showError(msg) {
    errorMessage.textContent = msg;
    errorToast.style.display = 'block';
    setTimeout(() => {
        errorToast.style.display = 'none';
    }, 4000);
}

/**
 * 显示成功提示
 */
function showSuccess(msg) {
    successToast.querySelector('span').textContent = msg;
    successToast.style.display = 'block';
    setTimeout(() => {
        successToast.style.display = 'none';
    }, 2000);
}

/**
 * 更新按钮状态
 */
function updateButtonState() {
    const hasText = textInput.value.trim().length > 0;
    clearBtn.disabled = !hasText;
    summarizeBtn.disabled = !hasText || isLoading;
}

/**
 * 设置 Loading 状态
 */
function setLoading(loading) {
    isLoading = loading;
    const btnText = summarizeBtn.querySelector('.btn-text');
    const btnLoading = summarizeBtn.querySelector('.btn-loading');

    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        summarizeBtn.classList.add('loading');
        textInput.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        summarizeBtn.classList.remove('loading');
        textInput.disabled = false;
    }

    updateButtonState();
}

/**
 * 获取当前选择的模式
 */
function getSelectedMode() {
    const selected = document.querySelector('input[name="mode"]:checked');
    return selected ? selected.value : 'normal';
}

/**
 * 调用总结 API（文本模式）
 */
async function callSummaryAPI(text) {
    const mode = getSelectedMode();
    const response = await fetch(`${API_BASE}/summary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            mode: mode
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `请求失败: ${response.status}`);
    }

    return response.json();
}

/**
 * 调用总结 API（文件上传模式）
 */
async function callSummaryUploadAPI(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', getSelectedMode());

    const response = await fetch(`${API_BASE}/summary/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `上传失败: ${response.status}`);
    }

    return response.json();
}

/**
 * 处理文件上传
 */
async function handleFileUpload(file) {
    // 校验文件类型
    if (!file.name.endsWith('.txt')) {
        showError('仅支持 .txt 文件');
        return;
    }

    // 校验文件大小（≤ 200KB）
    if (file.size > 200 * 1024) {
        showError('文件超过 200KB，请先精简内容');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        textInput.value = e.target.result;
        charCount.textContent = `${textInput.value.length} 字`;
        updateButtonState();
    };
    reader.onerror = () => {
        showError('文件读取失败，请重试');
    };
    reader.readAsText(file);

    // 显示文件名
    currentFileName = file.name;
    fileNameDisplay.textContent = `📄 ${file.name}`;
    fileNameDisplay.style.display = 'block';
}

/**
 * 渲染结果
 */
function renderResult(data) {
    // 显示结果区
    resultSection.style.display = 'block';

    // 填充总结
    summaryText.textContent = data.summary;

    // 渲染关键词
    keywordsContainer.innerHTML = '';
    data.keywords.forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        keywordsContainer.appendChild(tag);
    });

    // 显示原文长度
    originalLength.textContent = `原文 ${data.word_count} 字`;

    // 滚动到结果
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 保存历史
    const originalText = textInput.value.trim();
    addHistory(originalText, data.summary, data.keywords, getSelectedMode());
}

/**
 * 清空所有内容
 */
function clearAll() {
    textInput.value = '';
    charCount.textContent = '0 字';
    resultSection.style.display = 'none';
    summaryText.textContent = '';
    keywordsContainer.innerHTML = '';
    fileInput.value = '';           // 清空文件选择
    currentFileName = null;
    fileNameDisplay.style.display = 'none';
    updateButtonState();
    textInput.focus();
}

/**
 * 复制结果到剪贴板
 */
async function copyResult() {
    const summary = summaryText.textContent;
    const keywords = Array.from(keywordsContainer.querySelectorAll('.keyword-tag'))
        .map(tag => tag.textContent)
        .join('、');

    const text = `【总结】\n${summary}\n\n【关键词】\n${keywords}`;

    try {
        await navigator.clipboard.writeText(text);
        showSuccess('复制成功！');
    } catch (err) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showSuccess('复制成功！');
    }
}

/**
 * 主流程：点击总结
 */
async function handleSummarize() {
    const text = textInput.value.trim();

    if (!text) {
        showError('请输入要总结的文本');
        return;
    }

    setLoading(true);
    resultSection.style.display = 'none';

    try {
        const data = await callSummaryAPI(text);
        renderResult(data);
    } catch (err) {
        showError(err.message || '总结失败，请重试');
        console.error('API Error:', err);
    } finally {
        setLoading(false);
    }
}

// 事件绑定
textInput.addEventListener('input', () => {
    const len = textInput.value.length;
    charCount.textContent = `${len} 字`;
    // 用户输入时清除文件名标记
    if (currentFileName && textInput.value !== '') {
        // 保持文件名显示（用户可能在编辑上传的内容）
    }
    updateButtonState();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

clearBtn.addEventListener('click', clearAll);
summarizeBtn.addEventListener('click', handleSummarize);
copyBtn.addEventListener('click', copyResult);

resetBtn.addEventListener('click', () => {
    // 重新用当前文本总结
    handleSummarize();
});

// 初始化
updateButtonState();
renderHistory();
