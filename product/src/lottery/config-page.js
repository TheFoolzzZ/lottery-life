import "./config-page.css";

// 配置页面状态
var configState = {
    participants: [],
    prizes: [],
    musicFile: null,
    musicFileName: ""
};

// DOM元素缓存
var elements = {};

// 初始化配置页面
export function initConfigPage() {
    cacheElements();
    bindEvents();
    loadExistingConfig();
}

// 缓存DOM元素
function cacheElements() {
    elements = {
        configPage: document.getElementById("configPage"),
        // 参与者相关
        participantName: document.getElementById("participantName"),
        participantNote: document.getElementById("participantNote"),
        addParticipantBtn: document.getElementById("addParticipantBtn"),
        pasteTextarea: document.getElementById("pasteTextarea"),
        parseTextBtn: document.getElementById("parseTextBtn"),
        participantList: document.getElementById("participantList"),
        participantCount: document.getElementById("participantCount"),
        clearAllParticipantsBtn: document.getElementById("clearAllParticipantsBtn"),
        // 奖项相关
        addPrizeBtn: document.getElementById("addPrizeBtn"),
        prizeCards: document.getElementById("prizeCards"),
        prizeCount: document.getElementById("prizeCount"),
        totalWinners: document.getElementById("totalWinners"),
        // 音乐相关
        musicUpload: document.getElementById("musicUpload"),
        musicList: document.getElementById("musicList"),
        // 弹窗相关
        prizeModal: document.getElementById("prizeModal"),
        prizeForm: document.getElementById("prizeForm"),
        prizeModalTitle: document.getElementById("prizeModalTitle"),
        closePrizeModal: document.getElementById("closePrizeModal"),
        cancelPrizeBtn: document.getElementById("cancelPrizeBtn"),
        savePrizeBtn: document.getElementById("savePrizeBtn"),
        prizeImageUpload: document.getElementById("prizeImageUpload"),
        prizeImageStatus: document.getElementById("prizeImageStatus"),
        prizeImagePreview: document.getElementById("prizeImagePreview"),
        prizeImageInput: document.querySelector('input[name="prizeImage"]'),
        // 确认弹窗
        confirmModal: document.getElementById("confirmModal"),
        confirmMessage: document.getElementById("confirmMessage"),
        confirmYesBtn: document.getElementById("confirmYesBtn"),
        confirmNoBtn: document.getElementById("confirmNoBtn"),
        // 提交按钮
        startLotteryBtn: document.getElementById("startLotteryBtn"),
        // 标签页
        tabManual: document.getElementById("tabManual"),
        tabPaste: document.getElementById("tabPaste"),
        contentManual: document.getElementById("contentManual"),
        contentPaste: document.getElementById("contentPaste")
    };
}

// 安全添加事件监听器
function safeAddEventListener(element, event, handler) {
    if (element) {
        element.addEventListener(event, handler);
    }
}

// 绑定事件
function bindEvents() {
    // 标签页切换
    safeAddEventListener(elements.tabManual, "click", function () { switchTab("manual"); });
    safeAddEventListener(elements.tabPaste, "click", function () { switchTab("paste"); });

    // 参与者操作
    safeAddEventListener(elements.addParticipantBtn, "click", addParticipant);
    safeAddEventListener(elements.parseTextBtn, "click", parseText);
    safeAddEventListener(elements.clearAllParticipantsBtn, "click", function () {
        showConfirm("确定要清空所有参与者吗？此操作不可恢复。", function () {
            configState.participants = [];
            renderParticipants();
        });
    });

    // 奖项操作
    safeAddEventListener(elements.addPrizeBtn, "click", function () { openPrizeModal(); });
    safeAddEventListener(elements.closePrizeModal, "click", closePrizeModal);
    safeAddEventListener(elements.cancelPrizeBtn, "click", closePrizeModal);
    safeAddEventListener(elements.savePrizeBtn, "click", savePrize);
    safeAddEventListener(elements.prizeImageUpload, "change", handlePrizeImageUpload);
    safeAddEventListener(elements.prizeImageInput, "change", function () {
        setPrizeImagePreview(elements.prizeImageInput.value.trim());
        setPrizeImageStatus(elements.prizeImageInput.value.trim() ? "已使用链接" : "未上传");
    });

    // 确认弹窗
    safeAddEventListener(elements.confirmNoBtn, "click", closeConfirm);

    // 音乐上传
    safeAddEventListener(elements.musicUpload, "change", handleMusicUpload);

    // 开始抽奖
    safeAddEventListener(elements.startLotteryBtn, "click", startLottery);

    // 回车提交
    safeAddEventListener(elements.participantName, "keypress", function (e) {
        if (e.key === "Enter") addParticipant();
    });
}

// 安全操作classList
function safeClassListAdd(element, className) {
    if (element) {
        element.classList.add(className);
    }
}

function safeClassListRemove(element, className) {
    if (element) {
        element.classList.remove(className);
    }
}

// 标签页切换
function switchTab(tab) {
    if (tab === "manual") {
        safeClassListAdd(elements.tabManual, "active");
        safeClassListRemove(elements.tabPaste, "active");
        safeClassListAdd(elements.contentManual, "active");
        safeClassListRemove(elements.contentPaste, "active");
    } else {
        safeClassListRemove(elements.tabManual, "active");
        safeClassListAdd(elements.tabPaste, "active");
        safeClassListRemove(elements.contentManual, "active");
        safeClassListAdd(elements.contentPaste, "active");
    }
}

// 保存到本地存储与后端
function saveToLocalStorage() {
    try {
        localStorage.setItem("lottery_config", JSON.stringify(configState));
    } catch (e) {
        console.warn("Local storage error:", e);
    }
}

// 加载现有配置
function loadExistingConfig() {
    // 优先从本地存储加载，解决 Vercel 无状态问题
    var localData = null;
    try {
        var raw = localStorage.getItem("lottery_config");
        if (raw) localData = JSON.parse(raw);
    } catch (e) {
        console.warn("Local storage parse error:", e);
    }

    if (localData) {
        console.log("加载本地缓存配置");
        if (localData.participants) configState.participants = localData.participants;
        if (localData.prizes) configState.prizes = localData.prizes;
        if (localData.musicFileName) configState.musicFileName = localData.musicFileName;

        renderParticipants();
        renderPrizes();
        renderMusic();
        return;
    }

    // 如果没有本地数据，再请求后端
    window.AJAX({
        url: "/getConfig",
        success: function (data) {
            if (data.participants && data.participants.length > 0) {
                configState.participants = data.participants;
            }
            if (data.prizes && data.prizes.length > 0) {
                configState.prizes = data.prizes;
            }
            if (data.musicFileName) {
                configState.musicFileName = data.musicFileName;
            }
            renderParticipants();
            renderPrizes();
            renderMusic();
        },
        error: function () {
            renderParticipants();
            renderPrizes();
            renderMusic();
        }
    });
}

// ============ 参与者管理 ============

// 添加参与者
function addParticipant() {
    var name = elements.participantName ? elements.participantName.value.trim() : "";
    var note = elements.participantNote ? (elements.participantNote.value.trim() || "-") : "-";

    if (!name) {
        alert("请输入参与者姓名");
        return;
    }

    configState.participants.push({
        id: Date.now(),
        name: name,
        note: note
    });

    if (elements.participantName) elements.participantName.value = "";
    if (elements.participantNote) elements.participantNote.value = "";
    if ((elements.participantName)) elements.participantName.focus();

    renderParticipants();
    saveToLocalStorage(); // 实时保存
    checkDuplicateNames();
}

// 解析粘贴文本
function parseText() {
    var text = elements.pasteTextarea ? elements.pasteTextarea.value.trim() : "";
    if (!text) {
        alert("请先粘贴文本内容");
        return;
    }

    // 支持多种格式: "1. 张三", "1、张三", "1.张三", "张三"
    var lines = text.split(/\n/);
    var addedCount = 0;

    lines.forEach(function (line) {
        line = line.trim();
        if (!line) return;

        // 尝试匹配序号格式
        var match = line.match(/^\d+[\.、\)\]\s]+\s*(.+)/);
        var name = match ? match[1].trim() : line;

        if (name) {
            configState.participants.push({
                id: Date.now() + addedCount,
                name: name,
                note: "-"
            });
            addedCount++;
        }
    });

    if (addedCount > 0) {
        if (elements.pasteTextarea) elements.pasteTextarea.value = "";
        renderParticipants();
        saveToLocalStorage(); // 实时保存
        checkDuplicateNames();
        alert("成功添加 " + addedCount + " 名参与者");
    } else {
        alert("未能解析出任何参与者");
    }
}

// 检查重名
function checkDuplicateNames() {
    var nameCount = {};
    configState.participants.forEach(function (p) {
        nameCount[p.name] = (nameCount[p.name] || 0) + 1;
    });

    var duplicates = [];
    for (var name in nameCount) {
        if (nameCount[name] > 1) {
            duplicates.push(name);
        }
    }

    if (duplicates.length > 0) {
        console.log("发现重名参与者:", duplicates);
    }
}

// 编辑参与者
function editParticipant(id) {
    var participant = null;
    for (var i = 0; i < configState.participants.length; i++) {
        if (configState.participants[i].id === id) {
            participant = configState.participants[i];
            break;
        }
    }
    if (!participant) return;

    var newName = prompt("修改姓名:", participant.name);
    if (newName === null) return;
    if (!newName.trim()) {
        alert("姓名不能为空");
        return;
    }

    var newNote = prompt("修改备注:", participant.note);

    participant.name = newName.trim();
    participant.note = (newNote && newNote.trim()) ? newNote.trim() : "-";

    renderParticipants();
    saveToLocalStorage(); // 实时保存
}

// 删除参与者
function deleteParticipant(id) {
    console.log("尝试删除参与者 ID:", id);
    var targetId = Number(id);
    var beforeCount = configState.participants.length;
    configState.participants = configState.participants.filter(function (p) { return Number(p.id) !== targetId; });
    console.log("删除后剩余:", configState.participants.length);

    if (configState.participants.length === beforeCount) {
        console.warn("删除失败：未找到匹配 ID");
    } else {
        saveToLocalStorage(); // 实时保存
    }
    renderParticipants();
}

// 清空所有参与者
function clearAllParticipants() {
    showConfirm("确定要清空所有参与者吗？此操作不可恢复。", function () {
        console.log("执行清空所有参与者");
        configState.participants = [];
        saveToLocalStorage(); // 实时保存
        renderParticipants();
    });
}

// 渲染参与者列表
function renderParticipants() {
    var count = configState.participants.length;
    if (elements.participantCount) {
        elements.participantCount.textContent = count;
    }

    if (!elements.participantList) return;

    if (count === 0) {
        elements.participantList.innerHTML = '<tr><td colspan="4" class="empty-state">暂无参与者，请添加</td></tr>';
        return;
    }

    var html = "";
    configState.participants.forEach(function (p, index) {
        html += '<tr>' +
            '<td>' + (index + 1) + '</td>' +
            '<td>' + escapeHtml(p.name) + '</td>' +
            '<td>' + escapeHtml(p.note) + '</td>' +
            '<td class="actions">' +
            '<button class="config-btn small" onclick="window.configPage.editParticipant(' + p.id + ')">编辑</button>' +
            '<button class="config-btn small danger" onclick="window.configPage.deleteParticipant(' + p.id + ')">删除</button>' +
            '</td>' +
            '</tr>';
    });
    elements.participantList.innerHTML = html;

    updateValidation();
}

// ============ 奖项管理 ============

var editingPrizeId = null;

// 打开奖项弹窗
function openPrizeModal(prizeId) {
    editingPrizeId = prizeId || null;

    if (prizeId) {
        var prize = null;
        for (var i = 0; i < configState.prizes.length; i++) {
            if (configState.prizes[i].id === prizeId) {
                prize = configState.prizes[i];
                break;
            }
        }
        if (!prize) return;

        if (elements.prizeModalTitle) {
            elements.prizeModalTitle.textContent = "编辑奖项";
        }
        fillPrizeForm(prize);
    } else {
        if (elements.prizeModalTitle) {
            elements.prizeModalTitle.textContent = "添加奖项";
        }
        resetPrizeForm();
    }

    safeClassListRemove(elements.prizeModal, "hidden");
}

// 关闭奖项弹窗
function closePrizeModal() {
    safeClassListAdd(elements.prizeModal, "hidden");
    editingPrizeId = null;
    resetPrizeForm();
}

// 填充奖项表单
function fillPrizeForm(prize) {
    var form = elements.prizeForm;
    if (!form) return;

    form.prizeName.value = prize.text || "";
    form.prizeWinnerCount.value = prize.count || 1;
    form.prizeDescription.value = prize.title || "";
    form.prizeImage.value = prize.img || "";
    setPrizeImagePreview(prize.img || "");
    setPrizeImageStatus(prize.img ? "已加载" : "未上传");
}

// 重置奖项表单
function resetPrizeForm() {
    var form = elements.prizeForm;
    if (!form) return;

    form.prizeName.value = "";
    form.prizeWinnerCount.value = 1;
    form.prizeDescription.value = "";
    form.prizeImage.value = "";
    resetPrizeImageUpload();
}

// 保存奖项
function savePrize() {
    var form = elements.prizeForm;
    if (!form) return;

    var name = form.prizeName.value.trim();
    var count = parseInt(form.prizeWinnerCount.value) || 1;
    var description = form.prizeDescription.value.trim();
    var image = form.prizeImage.value.trim();

    if (!name) {
        alert("请输入奖项名称");
        return;
    }

    if (!description) {
        alert("请输入奖项描述");
        return;
    }

    if (count < 1) {
        alert("中奖人数至少为1");
        return;
    }

    // 检查名称是否重复
    var duplicate = null;
    for (var i = 0; i < configState.prizes.length; i++) {
        var p = configState.prizes[i];
        if (p.text === name && p.id !== editingPrizeId) {
            duplicate = p;
            break;
        }
    }
    if (duplicate) {
        alert("奖项名称已存在，请使用其他名称");
        return;
    }

    if (editingPrizeId) {
        // 编辑现有奖项
        for (var j = 0; j < configState.prizes.length; j++) {
            if (configState.prizes[j].id === editingPrizeId) {
                configState.prizes[j].text = name;
                configState.prizes[j].count = count;
                configState.prizes[j].title = description;
                configState.prizes[j].img = image || "../img/secrit.jpg";
                break;
            }
        }
    } else {
        // 添加新奖项
        var maxType = 0;
        configState.prizes.forEach(function (p) {
            if ((p.type || 0) > maxType) maxType = p.type || 0;
        });
        configState.prizes.push({
            id: Date.now(),
            type: maxType + 1,
            text: name,
            count: count,
            title: description,
            img: image || "../img/secrit.jpg"
        });
    }

    closePrizeModal();
    saveToLocalStorage(); // 实时保存
    renderPrizes();
}

function getCloudinaryConfig() {
    return window.CLOUDINARY_CONFIG || null;
}

function setPrizeImageStatus(text) {
    if (elements.prizeImageStatus) {
        elements.prizeImageStatus.textContent = text || "未上传";
    }
}

function setPrizeImagePreview(url) {
    if (!elements.prizeImagePreview) return;
    if (!url) {
        elements.prizeImagePreview.textContent = "未选择图片";
        return;
    }
    elements.prizeImagePreview.innerHTML =
        '<img src="' +
        escapeHtml(url) +
        '" alt="奖项封面" onerror="this.parentNode.textContent=\'图片加载失败\'">';
}

function resetPrizeImageUpload() {
    if (elements.prizeImageUpload) {
        elements.prizeImageUpload.value = "";
    }
    setPrizeImagePreview("");
    setPrizeImageStatus("未上传");
}

function handlePrizeImageUpload(e) {
    var files = e.target.files;
    var file = files && files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("请上传图片文件");
        resetPrizeImageUpload();
        return;
    }

    var config = getCloudinaryConfig();
    if (!config || !config.cloudName || !config.uploadPreset) {
        alert("未配置图床，请改为粘贴图片链接");
        resetPrizeImageUpload();
        return;
    }

    setPrizeImageStatus("上传中...");
    setPrizeImagePreview(URL.createObjectURL(file));

    var formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", config.uploadPreset);
    if (config.folder) {
        formData.append("folder", config.folder);
    }

    fetch("https://api.cloudinary.com/v1_1/" + config.cloudName + "/image/upload", {
        method: "POST",
        body: formData
    })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data || !data.secure_url) {
                throw new Error("upload failed");
            }
            if (elements.prizeImageInput) {
                elements.prizeImageInput.value = data.secure_url;
            }
            setPrizeImagePreview(data.secure_url);
            setPrizeImageStatus("上传成功");
        })
        .catch(function () {
            setPrizeImageStatus("上传失败");
            alert("封面上传失败，请改为粘贴图片链接");
        });
}

// 删除奖项
function deletePrize(id) {
    console.log("尝试删除奖项 ID:", id);
    var targetId = Number(id);
    showConfirm("确定要删除此奖项吗？", function () {
        console.log("确认删除奖项:", targetId);
        var beforeCount = configState.prizes.length;
        configState.prizes = configState.prizes.filter(function (p) { return Number(p.id) !== targetId; });

        if (configState.prizes.length === beforeCount) {
            console.warn("删除/过滤奖项失败，可能是 ID 不匹配");
        } else {
            saveToLocalStorage(); // 实时保存
        }
        renderPrizes();
    });
}

// 渲染奖项列表
function renderPrizes() {
    var count = configState.prizes.length;
    var totalWinnersCount = 0;
    configState.prizes.forEach(function (p) {
        totalWinnersCount += (p.count || 0);
    });

    if (elements.prizeCount) {
        elements.prizeCount.textContent = count;
    }
    if (elements.totalWinners) {
        elements.totalWinners.textContent = totalWinnersCount;
    }

    if (!elements.prizeCards) return;

    if (count === 0) {
        elements.prizeCards.innerHTML = '<div class="empty-state">暂无奖项，请添加</div>';
        return;
    }

    var html = "";
    configState.prizes.forEach(function (p) {
        var imgHtml = p.img
            ? '<img src="' + escapeHtml(p.img) + '" alt="' + escapeHtml(p.text) + '" onerror="this.parentNode.innerHTML=\'🎁\'">'
            : '<span class="placeholder">🎁</span>';

        html += '<div class="prize-card" draggable="true" data-id="' + p.id + '">' +
            '<span class="drag-handle">☰</span>' +
            '<div class="prize-img">' + imgHtml + '</div>' +
            '<div class="prize-info">' +
            '<div class="prize-name">' + escapeHtml(p.text) + '</div>' +
            '<div class="prize-desc">' + escapeHtml(p.title) + '</div>' +
            '</div>' +
            '<div class="prize-count">' + p.count + ' 人</div>' +
            '<div class="prize-actions">' +
            '<button class="config-btn small" onclick="window.configPage.openPrizeModal(' + p.id + ')">编辑</button>' +
            '<button class="config-btn small danger" onclick="window.configPage.deletePrize(' + p.id + ')">删除</button>' +
            '</div>' +
            '</div>';
    });
    elements.prizeCards.innerHTML = html;

    // 绑定拖拽事件
    initDragAndDrop();
    updateValidation();
}

// 拖拽排序
function initDragAndDrop() {
    var cards = document.querySelectorAll(".prize-card");
    var draggedItem = null;

    cards.forEach(function (card) {
        card.addEventListener("dragstart", function (e) {
            draggedItem = card;
            card.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
        });

        card.addEventListener("dragend", function () {
            if (draggedItem) {
                draggedItem.classList.remove("dragging");
            }
            draggedItem = null;
        });

        card.addEventListener("dragover", function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
        });

        card.addEventListener("drop", function (e) {
            e.preventDefault();
            if (!draggedItem || draggedItem === card) return;

            var draggedId = parseInt(draggedItem.dataset.id);
            var targetId = parseInt(card.dataset.id);

            var draggedIndex = -1;
            var targetIndex = -1;
            for (var i = 0; i < configState.prizes.length; i++) {
                if (configState.prizes[i].id === draggedId) draggedIndex = i;
                if (configState.prizes[i].id === targetId) targetIndex = i;
            }

            if (draggedIndex === -1 || targetIndex === -1) return;

            // 调换位置
            var removed = configState.prizes.splice(draggedIndex, 1)[0];
            configState.prizes.splice(targetIndex, 0, removed);

            renderPrizes();
        });
    });
}

// ============ 音乐管理 ============

function handleMusicUpload(e) {
    var files = e.target.files;
    var file = files && files[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
        alert("请上传音频文件");
        return;
    }

    configState.musicFile = file;
    configState.musicFileName = file.name;
    renderMusic();
}

function removeMusic() {
    configState.musicFile = null;
    configState.musicFileName = "";
    if (elements.musicUpload) {
        elements.musicUpload.value = "";
    }
    renderMusic();
}

function renderMusic() {
    if (!elements.musicList) return;

    if (!configState.musicFileName) {
        elements.musicList.innerHTML = '<div class="config-tip">未上传音乐，将使用系统默认音乐</div>';
        return;
    }

    elements.musicList.innerHTML = '<div class="music-item">' +
        '<span class="music-name">' +
        '<span class="music-icon">🎵</span>' +
        escapeHtml(configState.musicFileName) +
        '</span>' +
        '<button class="config-btn small danger" onclick="window.configPage.removeMusic()">删除</button>' +
        '</div>';
}

// ============ 确认弹窗 ============

var confirmCallback = null;

function showConfirm(message, callback) {
    if (elements.confirmMessage) {
        elements.confirmMessage.textContent = message;
    }
    confirmCallback = callback;
    safeClassListRemove(elements.confirmModal, "hidden");

    // 重新获取按钮以防引用丢失
    var yesBtn = document.getElementById("confirmYesBtn");
    if (yesBtn) {
        console.log("绑定确认按钮点击事件");
        yesBtn.onclick = function (e) {
            console.log("确认按钮被点击");
            e.preventDefault();
            e.stopPropagation();

            // 先保存回调引用，因为 closeConfirm 会清空 confirmCallback
            var callbackToRun = confirmCallback;
            closeConfirm();

            if (callbackToRun) {
                console.log("执行确认回调");
                callbackToRun();
            } else {
                console.warn("无确认回调 (已被清空或未设置)");
            }
        };
    } else {
        console.error("未找到确认按钮 confirmYesBtn");
    }
}

function closeConfirm() {
    safeClassListAdd(elements.confirmModal, "hidden");
    confirmCallback = null;
}

// ============ 验证与提交 ============

function updateValidation() {
    var participantCount = configState.participants.length;
    var totalWinnersCount = 0;
    configState.prizes.forEach(function (p) {
        totalWinnersCount += (p.count || 0);
    });

    // 检查中奖人数是否超过参与者人数
    var warningEl = document.getElementById("validationWarning");
    if (warningEl) {
        if (totalWinnersCount > participantCount && participantCount > 0) {
            warningEl.textContent = "⚠️ 中奖总人数(" + totalWinnersCount + ")超过参与者人数(" + participantCount + ")";
            warningEl.style.display = "block";
        } else {
            warningEl.style.display = "none";
        }
    }
}

function validateConfig() {
    if (configState.participants.length === 0) {
        alert("请至少添加1名参与者");
        return false;
    }

    if (configState.prizes.length === 0) {
        alert("请至少添加1个奖项");
        return false;
    }

    var totalWinnersCount = 0;
    configState.prizes.forEach(function (p) {
        totalWinnersCount += (p.count || 0);
    });
    if (totalWinnersCount > configState.participants.length) {
        alert("中奖总人数(" + totalWinnersCount + ")不能超过参与者人数(" + configState.participants.length + ")");
        return false;
    }

    return true;
}

function startLottery() {
    if (!validateConfig()) return;

    // 保存配置到服务器
    saveConfigToServer(function () {
        // 重新加载页面以重置所有状态
        try {
            return location.reload();
        } catch (e) {
            console.error("Reload failed", e);
        }
    });
}

function saveConfigToServer(callback) {
    // 处理参与者数据格式，兼容现有系统
    var users = configState.participants.map(function (p, index) {
        return [
            String(index + 1), // 工号/序号
            p.name,
            p.note
        ];
    });

    // 处理奖项数据格式
    var prizes = configState.prizes.map(function (p, index) {
        return {
            type: index + 1,
            count: Number(p.count),
            text: p.text,
            title: p.title,
            img: p.img
        };
    });

    // 添加特别奖占位符
    prizes.unshift({
        type: 0,
        count: 1000,
        title: "",
        text: "特别奖"
    });

    var EACH_COUNT = [1];
    for (var i = 1; i < prizes.length; i++) {
        EACH_COUNT.push(Math.min(prizes[i].count, 10));
    }

    window.AJAX({
        url: "/saveConfig",
        data: {
            users: users,
            prizes: prizes,
            EACH_COUNT: EACH_COUNT,
            musicFileName: configState.musicFileName
        },
        success: function (data) {
            // 保存成功后同时也存一份到 LocalStorage
            saveToLocalStorage();
            if (callback) callback();
        },
        error: function () {
            // 网络错误时，保存到本地并允许继续
            saveToLocalStorage();
            console.log("网络连接异常，已保存配置到本地浏览器");
            if (callback) callback();
        }
    });
}

// ============ 工具函数 ============

function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// 显示配置页面
export function showConfigPage() {
    safeClassListRemove(elements.configPage, "hidden");
}

// 隐藏配置页面
export function hideConfigPage() {
    safeClassListAdd(elements.configPage, "hidden");
}

// 获取当前配置
export function getConfig() {
    return configState;
}

// 暴露全局函数供HTML调用
window.configPage = {
    editParticipant: editParticipant,
    deleteParticipant: deleteParticipant,
    openPrizeModal: openPrizeModal,
    deletePrize: deletePrize,
    removeMusic: removeMusic,
    clearAllParticipants: clearAllParticipants
};
