(function () {
  "use strict";

  const STORAGE_KEY = "gacha-resource-planner:v1";
  const TEMPLATE_STORAGE_KEY = "gacha-resource-planner:templates:v1";
  const BACKUP_FORMAT = "gacha-resource-planner-backup";
  const BACKUP_VERSION = 1;
  const ACTIVE_TAB_KEY = "gacha-resource-planner:active-tab";
  const DEFAULTS = {
    stones: "0",
    tickets: "0",
    drawsPerTicket: "1",
    singleCost: "100",
    tenCost: "1000",
    ceiling: "200",
    currentPity: "0",
    targetCopies: "1",
    startDate: "",
    endDate: "",
    dailyStones: "0",
    dailyTickets: "0",
    exchangeCost: "300",
    currentPoints: "0",
    rate5: "1",
    targetRate5: "0.3",
    softPityStart: "0",
    rate4: "9",
    rate3: "40",
    rate2: "50",
    ceilingMode: "pity",
    guaranteeAfterMiss: false,
    featuredGuaranteed: false,
    selectedPreset: "",
    rarityLabel5: "★5",
    rarityLabel4: "★4",
    rarityLabel3: "★3",
    rarityLabel2: "★2",
    bonusItems: [],
    includeToday: false,
  };
  const NUMERIC_FIELDS = [
    "stones",
    "tickets",
    "drawsPerTicket",
    "singleCost",
    "tenCost",
    "ceiling",
    "currentPity",
    "targetCopies",
    "dailyStones",
    "dailyTickets",
    "exchangeCost",
    "currentPoints",
    "softPityStart",
  ];
  const RATE_FIELDS = ["rate5", "rate4", "rate3", "rate2"];
  const TEMPLATE_FIELDS = [
    "drawsPerTicket",
    "singleCost",
    "tenCost",
    "ceiling",
    "currentPity",
    "exchangeCost",
    "currentPoints",
    "dailyStones",
    "dailyTickets",
    "rate5",
    "targetRate5",
    "softPityStart",
    "rate4",
    "rate3",
    "rate2",
    "startDate",
    "endDate",
    "ceilingMode",
    "guaranteeAfterMiss",
    "featuredGuaranteed",
    "selectedPreset",
    "rarityLabel5",
    "rarityLabel4",
    "rarityLabel3",
    "rarityLabel2",
    "bonusItems",
    "includeToday",
  ];
  const RARITIES = [
    { key: "star5", field: "rate5", labelKey: "rarityLabel5" },
    { key: "star4", field: "rate4", labelKey: "rarityLabel4" },
    { key: "star3", field: "rate3", labelKey: "rarityLabel3" },
    { key: "star2", field: "rate2", labelKey: "rarityLabel2" },
  ];
  const PRESET_TEMPLATES = {
    "トリッカル 通常キャラPU": {
      singleCost: "100",
      tenCost: "1000",
      exchangeCost: "200",
      rate5: "3",
      targetRate5: "0.8",
      rate4: "21",
      rate3: "76",
      rate2: "0",
      ceilingMode: "points",
      rarityLabel5: "★3",
      rarityLabel4: "★2",
      rarityLabel3: "★1",
      rarityLabel2: "その他",
    },
    "トリッカル エルダインPU": {
      singleCost: "100",
      tenCost: "1000",
      exchangeCost: "300",
      rate5: "3",
      targetRate5: "0.6",
      rate4: "21",
      rate3: "76",
      rate2: "0",
      ceilingMode: "points",
      rarityLabel5: "★3",
      rarityLabel4: "★2",
      rarityLabel3: "★1",
      rarityLabel2: "その他",
    },
    "トリッカル カードガチャ": {
      singleCost: "100",
      tenCost: "1000",
      exchangeCost: "150",
      rate5: "3",
      targetRate5: "0.8",
      rate4: "21",
      rate3: "76",
      rate2: "0",
      ceilingMode: "points",
      rarityLabel5: "★3",
      rarityLabel4: "★2",
      rarityLabel3: "★1",
      rarityLabel2: "その他",
    },
    "崩壊：スターレイル キャラクター": {
      singleCost: "160",
      tenCost: "1600",
      ceiling: "90",
      rate5: "0.6",
      targetRate5: "0.3",
      softPityStart: "74",
      rate4: "5.1",
      rate3: "94.3",
      rate2: "0",
      ceilingMode: "pity",
      guaranteeAfterMiss: true,
    },
    "崩壊：スターレイル 光円錐": {
      singleCost: "160",
      tenCost: "1600",
      ceiling: "80",
      rate5: "0.8",
      targetRate5: "0.6",
      softPityStart: "66",
      rate4: "6.6",
      rate3: "92.6",
      rate2: "0",
      ceilingMode: "pity",
      guaranteeAfterMiss: true,
    },
    "鳴潮 キャラクター": {
      singleCost: "160",
      tenCost: "1600",
      ceiling: "80",
      rate5: "0.8",
      targetRate5: "0.4",
      rate4: "6",
      rate3: "93.2",
      rate2: "0",
      ceilingMode: "pity",
      guaranteeAfterMiss: true,
    },
    "鳴潮 武器": {
      singleCost: "160",
      tenCost: "1600",
      ceiling: "80",
      rate5: "0.8",
      targetRate5: "0.8",
      rate4: "6",
      rate3: "93.2",
      rate2: "0",
      ceilingMode: "pity",
    },
    "アークナイツ：エンドフィールド キャラクター": {
      singleCost: "600",
      tenCost: "6000",
      ceiling: "99",
      rate5: "2",
      targetRate5: "1",
      softPityStart: "50",
      rate4: "8",
      rate3: "50",
      rate2: "40",
      ceilingMode: "pity",
      rarityLabel5: "★6",
      rarityLabel4: "★5",
      rarityLabel3: "★4",
      rarityLabel2: "★3",
    },
    "モンスターストライク": {
      singleCost: "5",
      tenCost: "50",
      ceiling: "200",
      rate5: "12",
      targetRate5: "0.6",
      rate4: "88",
      rate3: "0",
      rate2: "0",
      ceilingMode: "pity",
    },
    "Fate/Grand Order": {
      singleCost: "3",
      tenCost: "30",
      ceiling: "330",
      rate5: "1",
      targetRate5: "0.8",
      rate4: "3",
      rate3: "40",
      rate2: "56",
      ceilingMode: "pity",
    },
    "学園アイドルマスター Pアイドル": {
      singleCost: "250",
      tenCost: "2500",
      ceiling: "200",
      rate5: "5",
      targetRate5: "0.75",
      rate4: "10",
      rate3: "85",
      rate2: "0",
      ceilingMode: "points",
      exchangeCost: "200",
    },
    "学園アイドルマスター サポートカード": {
      singleCost: "250",
      tenCost: "2500",
      ceiling: "200",
      rate5: "5",
      targetRate5: "0.75",
      rate4: "10",
      rate3: "85",
      rate2: "0",
      ceilingMode: "points",
      exchangeCost: "200",
    },
  };

  const form = document.querySelector("#calculator-form");
  const resetButton = document.querySelector("#reset-button");
  const simulateButton = document.querySelector("#simulate-button");
  const statisticsButton = document.querySelector("#statistics-button");
  const trialCountSelect = document.querySelector("#trial-count");
  const saveIndicator = document.querySelector("#save-indicator");
  const templateNameInput = document.querySelector("#template-name");
  const presetTemplateSelect = document.querySelector(
    "#preset-template-select"
  );
  const loadPresetButton = document.querySelector("#load-preset-button");
  const templateSelect = document.querySelector("#template-select");
  const saveTemplateButton = document.querySelector("#save-template-button");
  const loadTemplateButton = document.querySelector("#load-template-button");
  const deleteTemplateButton = document.querySelector(
    "#delete-template-button"
  );
  const templateMessage = document.querySelector("#template-message");
  const downloadBackupButton = document.querySelector(
    "#download-backup-button"
  );
  const backupFileInput = document.querySelector("#backup-file-input");
  const shareCodeInput = document.querySelector("#share-code");
  const copyShareButton = document.querySelector("#copy-share-button");
  const importShareButton = document.querySelector("#import-share-button");
  const dataMessage = document.querySelector("#data-message");
  const appTabs = document.querySelectorAll(".app-tab");
  const LOCKED_TABS_WITHOUT_PRESET = ["simulation", "settings", "schedule"];
  const bonusDateInput = document.querySelector("#bonus-date");
  const bonusNameInput = document.querySelector("#bonus-name");
  const bonusStonesInput = document.querySelector("#bonus-stones");
  const bonusTicketsInput = document.querySelector("#bonus-tickets");
  const addBonusButton = document.querySelector("#add-bonus-button");
  const bonusList = document.querySelector("#bonus-list");
  const numberFormat = new Intl.NumberFormat("ja-JP");
  let saveIndicatorTimer;
  let templateMessageTimer;
  let dataMessageTimer;
  let bonusItems = [];
  let appliedPreset = "";
  let rarityLabels = {
    rarityLabel5: DEFAULTS.rarityLabel5,
    rarityLabel4: DEFAULTS.rarityLabel4,
    rarityLabel3: DEFAULTS.rarityLabel3,
    rarityLabel2: DEFAULTS.rarityLabel2,
  };

  function field(name) {
    return form.elements.namedItem(name);
  }

  function hasSelectedPreset() {
    return Boolean(appliedPreset);
  }

  function presetSupportsFeaturedGuarantee() {
    const preset = PRESET_TEMPLATES[appliedPreset];
    return Boolean(preset?.guaranteeAfterMiss);
  }

  function booleanFieldValue(name) {
    const element = field(name);
    return element.type === "checkbox"
      ? element.checked
      : element.value === "true";
  }

  function setBooleanField(name, value) {
    const element = field(name);
    if (element.type === "checkbox") {
      element.checked = Boolean(value);
      return;
    }
    element.value = String(Boolean(value));
  }

  function normalizeDateValue(value) {
    return value ? String(value).slice(0, 10) : "";
  }

  function setActiveTab(tabName) {
    const validTab = [
      "calculator",
      "simulation",
      "settings",
      "schedule",
      "data",
    ].includes(tabName)
      ? tabName
      : "calculator";
    const nextTab =
      !hasSelectedPreset() && LOCKED_TABS_WITHOUT_PRESET.includes(validTab)
        ? "calculator"
        : validTab;
    document.body.dataset.activeTab = nextTab;
    localStorage.setItem(ACTIVE_TAB_KEY, nextTab);

    for (const tab of appTabs) {
      const active = tab.dataset.tab === nextTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    }
    if (nextTab === "settings") {
      expandFieldset(document.querySelector(".gacha-fieldset"));
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function expandFieldset(fieldset) {
    if (!fieldset) {
      return;
    }
    fieldset.classList.remove("is-collapsed");
    const toggle = fieldset.querySelector(":scope > legend .fieldset-toggle");
    if (toggle) {
      toggle.textContent = "閉じる";
      toggle.setAttribute("aria-expanded", "true");
    }
  }

  function setupCollapsibleFields() {
    for (const fieldset of form.querySelectorAll("fieldset")) {
      if (fieldset.classList.contains("preset-fieldset")) {
        continue;
      }
      const legend = fieldset.querySelector(":scope > legend");
      if (!legend) {
        continue;
      }
      fieldset.classList.add("collapsible-fieldset");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "fieldset-toggle";
      toggle.textContent = "閉じる";
      toggle.setAttribute("aria-expanded", "true");
      toggle.addEventListener("click", () => {
        const collapsed = fieldset.classList.toggle("is-collapsed");
        toggle.textContent = collapsed ? "開く" : "閉じる";
        toggle.setAttribute("aria-expanded", String(!collapsed));
      });
      legend.append(toggle);
    }
  }

  function setText(id, value) {
    document.querySelector(`#${id}`).textContent =
      typeof value === "number" ? numberFormat.format(value) : value;
  }

  function getRarityDefinitions() {
    return RARITIES.map((rarity) => ({
      ...rarity,
      label: rarityLabels[rarity.labelKey] || DEFAULTS[rarity.labelKey],
    }));
  }

  function updateRarityLabelText() {
    const topLabel = rarityLabels.rarityLabel5 || DEFAULTS.rarityLabel5;
    const labelMap = {
      "rate5-label": `${topLabel} 排出率`,
      "target-rate5-label": `狙いの${topLabel} 排出率`,
      "rate4-label": `${rarityLabels.rarityLabel4} 排出率`,
      "rate3-label": `${rarityLabels.rarityLabel3} 排出率`,
      "rate2-label": `${rarityLabels.rarityLabel2} 排出率`,
      "target-rate5-help": `${topLabel}全体のうち、狙いのキャラ・武器が出る確率`,
      "featured-guaranteed-label": `現在、次の${topLabel}は狙い確定`,
      "statistics-featured-label": topLabel,
    };

    for (const [id, text] of Object.entries(labelMap)) {
      const element = document.querySelector(`#${id}`);
      if (element) {
        element.textContent = text;
      }
    }
  }

  function readState() {
    const state = {};
    for (const name of NUMERIC_FIELDS) {
      state[name] = field(name).value;
    }
    state.startDate = normalizeDateValue(field("startDate").value);
    state.endDate = normalizeDateValue(field("endDate").value);
    for (const name of RATE_FIELDS) {
      state[name] = field(name).value;
    }
    state.targetRate5 = field("targetRate5").value;
    state.ceilingMode = field("ceilingMode").value;
    state.guaranteeAfterMiss = booleanFieldValue("guaranteeAfterMiss");
    state.featuredGuaranteed = booleanFieldValue("featuredGuaranteed");
    state.selectedPreset = appliedPreset;
    state.rarityLabel5 = rarityLabels.rarityLabel5;
    state.rarityLabel4 = rarityLabels.rarityLabel4;
    state.rarityLabel3 = rarityLabels.rarityLabel3;
    state.rarityLabel2 = rarityLabels.rarityLabel2;
    state.bonusItems = bonusItems;
    state.includeToday = booleanFieldValue("includeToday");
    return state;
  }

  function applyState(state) {
    const merged = { ...DEFAULTS, ...state };
    for (const name of NUMERIC_FIELDS) {
      field(name).value = merged[name];
    }
    field("startDate").value = normalizeDateValue(merged.startDate);
    field("endDate").value = normalizeDateValue(merged.endDate);
    if (state && state.dropRate !== undefined && state.rate5 === undefined) {
      merged.rate5 = state.dropRate;
    }
    for (const name of RATE_FIELDS) {
      field(name).value = merged[name];
    }
    field("targetRate5").value = merged.targetRate5;
    field("ceilingMode").value = merged.ceilingMode;
    setBooleanField("guaranteeAfterMiss", merged.guaranteeAfterMiss);
    setBooleanField("featuredGuaranteed", merged.featuredGuaranteed);
    appliedPreset = PRESET_TEMPLATES[merged.selectedPreset]
      ? merged.selectedPreset
      : "";
    presetTemplateSelect.value = appliedPreset;
    rarityLabels = {
      rarityLabel5: merged.rarityLabel5 || DEFAULTS.rarityLabel5,
      rarityLabel4: merged.rarityLabel4 || DEFAULTS.rarityLabel4,
      rarityLabel3: merged.rarityLabel3 || DEFAULTS.rarityLabel3,
      rarityLabel2: merged.rarityLabel2 || DEFAULTS.rarityLabel2,
    };
    updateRarityLabelText();
    bonusItems = Array.isArray(merged.bonusItems)
      ? merged.bonusItems.map((item) => ({
          id: item.id || String(Date.now() + Math.random()),
          date: item.date || "",
          name: item.name || "",
          stones: GachaCalculator.toNonNegativeInteger(item.stones),
          tickets: GachaCalculator.toNonNegativeInteger(item.tickets),
        }))
      : [];
    renderBonusItems();
    setBooleanField("includeToday", merged.includeToday);
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      applyState(saved ? JSON.parse(saved) : DEFAULTS);
    } catch {
      applyState(DEFAULTS);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readState()));
    saveIndicator.textContent = "保存しました";
    clearTimeout(saveIndicatorTimer);
    saveIndicatorTimer = setTimeout(() => {
      saveIndicator.textContent = "この端末に自動保存";
    }, 1200);
  }

  function loadTemplates() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(TEMPLATE_STORAGE_KEY) || "{}"
      );
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  function saveTemplates(templates) {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  }

  function formatBonusDate(value) {
    return value || "日付なし";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function renderBonusItems() {
    if (bonusItems.length === 0) {
      bonusList.innerHTML = '<p class="bonus-empty">臨時獲得はまだありません。</p>';
      return;
    }

    bonusList.innerHTML = bonusItems
      .map(
        (item) => `
          <div class="bonus-item" data-id="${item.id}">
            <div>
              <strong>${escapeHtml(item.name || "臨時獲得")}</strong>
              <span>${escapeHtml(formatBonusDate(item.date))} / 石 ${numberFormat.format(item.stones)}個 / チケット ${numberFormat.format(item.tickets)}枚</span>
            </div>
            <button class="bonus-delete-button" type="button" data-delete-bonus="${item.id}">削除</button>
          </div>
        `
      )
      .join("");
  }

  function addBonusItem() {
    const stones = GachaCalculator.toNonNegativeInteger(bonusStonesInput.value);
    const tickets = GachaCalculator.toNonNegativeInteger(
      bonusTicketsInput.value
    );
    if (stones === 0 && tickets === 0) {
      showDataMessage("臨時獲得の石かチケットを入力してください。", true);
      return;
    }

    bonusItems.push({
      id: String(Date.now()),
      date: bonusDateInput.value,
      name: bonusNameInput.value.trim(),
      stones,
      tickets,
    });
    bonusNameInput.value = "";
    bonusStonesInput.value = "0";
    bonusTicketsInput.value = "0";
    renderBonusItems();
    saveState();
    render();
  }

  function deleteBonusItem(id) {
    bonusItems = bonusItems.filter((item) => item.id !== id);
    renderBonusItems();
    saveState();
    render();
  }

  function bonusDateInRange(item, startDateValue, endDateValue) {
    if (!item.date) {
      return true;
    }
    const itemDate = new Date(`${item.date}T00:00`);
    if (Number.isNaN(itemDate.getTime())) {
      return true;
    }
    if (startDateValue) {
      const startDate = new Date(startDateValue);
      if (
        !Number.isNaN(startDate.getTime()) &&
        itemDate.getTime() < startDate.setHours(0, 0, 0, 0)
      ) {
        return false;
      }
    }
    if (endDateValue) {
      const endDate = new Date(endDateValue);
      if (
        !Number.isNaN(endDate.getTime()) &&
        itemDate.getTime() > endDate.setHours(23, 59, 59, 999)
      ) {
        return false;
      }
    }
    return true;
  }

  function bonusTotalsForForecast() {
    return bonusItems
      .filter((item) =>
        bonusDateInRange(item, field("startDate").value, field("endDate").value)
      )
      .reduce(
        (totals, item) => ({
          stones: totals.stones + item.stones,
          tickets: totals.tickets + item.tickets,
        }),
        { stones: 0, tickets: 0 }
      );
  }

  function showDataMessage(message, isError) {
    dataMessage.textContent = message;
    dataMessage.classList.toggle("error-message", Boolean(isError));
    clearTimeout(dataMessageTimer);
    dataMessageTimer = setTimeout(() => {
      dataMessage.textContent = "";
      dataMessage.classList.remove("error-message");
    }, 2600);
  }

  function createBackup() {
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      state: readState(),
      templates: loadTemplates(),
    };
  }

  function validateBackup(backup) {
    if (
      !backup ||
      typeof backup !== "object" ||
      backup.format !== BACKUP_FORMAT ||
      backup.version !== BACKUP_VERSION ||
      !backup.state ||
      typeof backup.state !== "object" ||
      !backup.templates ||
      typeof backup.templates !== "object" ||
      Array.isArray(backup.templates)
    ) {
      throw new Error("このアプリのバックアップデータではありません。");
    }
    return backup;
  }

  function applyBackup(backup) {
    const validated = validateBackup(backup);
    applyState(validated.state);
    saveTemplates(validated.templates);
    renderTemplateOptions();
    updateModeVisibility();
    saveState();
    render();
  }

  function utf8ToBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function base64ToUtf8(value) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    );
    return new TextDecoder().decode(bytes);
  }

  function createShareCode() {
    return `GRP1.${utf8ToBase64(JSON.stringify(createBackup()))}`;
  }

  function parseShareCode(value) {
    const trimmed = value.trim();
    if (!trimmed.startsWith("GRP1.")) {
      throw new Error("共有文字列の形式が正しくありません。");
    }
    return validateBackup(
      JSON.parse(base64ToUtf8(trimmed.slice("GRP1.".length)))
    );
  }

  function downloadBackup() {
    const json = JSON.stringify(createBackup(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `gacha-resource-planner-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showDataMessage("JSONをダウンロードしました。");
  }

  async function copyShareCode() {
    const code = createShareCode();
    shareCodeInput.value = code;
    try {
      await navigator.clipboard.writeText(code);
      showDataMessage("共有文字列をコピーしました。");
    } catch {
      shareCodeInput.focus();
      shareCodeInput.select();
      showDataMessage("文字列を選択しました。端末のコピー操作を使ってください。");
    }
  }

  function importShareCode() {
    try {
      applyBackup(parseShareCode(shareCodeInput.value));
      showDataMessage("共有文字列からデータを読み込みました。");
    } catch (error) {
      showDataMessage(error.message || "共有文字列を読み込めません。", true);
    }
  }

  async function importBackupFile(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    try {
      applyBackup(JSON.parse(await file.text()));
      showDataMessage("JSONからデータを読み込みました。");
    } catch (error) {
      showDataMessage(error.message || "JSONを読み込めません。", true);
    } finally {
      backupFileInput.value = "";
    }
  }

  function showTemplateMessage(message, isError) {
    templateMessage.textContent = message;
    templateMessage.classList.toggle("error-message", Boolean(isError));
    clearTimeout(templateMessageTimer);
    templateMessageTimer = setTimeout(() => {
      templateMessage.textContent = "";
      templateMessage.classList.remove("error-message");
    }, 2200);
  }

  function renderTemplateOptions(selectedName) {
    const templates = loadTemplates();
    templateSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "保存済みテンプレートを選択";
    templateSelect.append(placeholder);

    for (const name of Object.keys(templates).sort((a, b) =>
      a.localeCompare(b, "ja")
    )) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      templateSelect.append(option);
    }

    if (selectedName && templates[selectedName]) {
      templateSelect.value = selectedName;
    }
  }

  function renderPresetOptions() {
    for (const name of Object.keys(PRESET_TEMPLATES)) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      presetTemplateSelect.append(option);
    }
  }

  function loadSelectedPreset() {
    const name = presetTemplateSelect.value;
    const preset = PRESET_TEMPLATES[name];
    if (!preset) {
      showTemplateMessage("ゲーム別プリセットを選択してください。", true);
      return;
    }

    const resources = {
      stones: field("stones").value,
      tickets: field("tickets").value,
    };
    applyState({
      ...readState(),
      softPityStart: "0",
      guaranteeAfterMiss: false,
      featuredGuaranteed: false,
      rarityLabel5: DEFAULTS.rarityLabel5,
      rarityLabel4: DEFAULTS.rarityLabel4,
      rarityLabel3: DEFAULTS.rarityLabel3,
      rarityLabel2: DEFAULTS.rarityLabel2,
      exchangeCost: DEFAULTS.exchangeCost,
      ...preset,
      selectedPreset: name,
      currentPity: "0",
      currentPoints: "0",
      endDate: "",
      ...resources,
    });
    templateNameInput.value = name;
    updateModeVisibility();
    saveState();
    render();
    showTemplateMessage("プリセットを適用しました。提供割合をご確認ください。");
  }

  function readTemplateState() {
    const state = readState();
    return Object.fromEntries(
      TEMPLATE_FIELDS.map((name) => [name, state[name]])
    );
  }

  function saveCurrentTemplate() {
    const name = templateNameInput.value.trim();
    if (!name) {
      showTemplateMessage("テンプレート名を入力してください。", true);
      templateNameInput.focus();
      return;
    }

    const templates = loadTemplates();
    templates[name] = readTemplateState();
    saveTemplates(templates);
    renderTemplateOptions(name);
    showTemplateMessage("保存しました。");
  }

  function loadSelectedTemplate() {
    const name = templateSelect.value;
    const templates = loadTemplates();
    if (!name || !templates[name]) {
      showTemplateMessage("テンプレートを選択してください。", true);
      return;
    }

    const resources = {
      stones: field("stones").value,
      tickets: field("tickets").value,
    };
    applyState({
      ...readState(),
      ...templates[name],
      ...resources,
    });
    templateNameInput.value = name;
    updateModeVisibility();
    saveState();
    render();
    showTemplateMessage("読み込みました。");
  }

  function deleteSelectedTemplate() {
    const name = templateSelect.value;
    const templates = loadTemplates();
    if (!name || !templates[name]) {
      showTemplateMessage("削除するテンプレートを選択してください。", true);
      return;
    }

    delete templates[name];
    saveTemplates(templates);
    renderTemplateOptions();
    if (templateNameInput.value.trim() === name) {
      templateNameInput.value = "";
    }
    showTemplateMessage("削除しました。");
  }

  function integerValue(name) {
    return GachaCalculator.toNonNegativeInteger(field(name).value);
  }

  function setError(name, message) {
    const input = field(name);
    const error = document.querySelector(`[data-error-for="${name}"]`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
  }

  function validate() {
    let valid = true;

    for (const name of NUMERIC_FIELDS) {
      const input = field(name);
      const value = Number(input.value);
      let message = "";

      if (input.value === "" || !Number.isFinite(value)) {
        message = "数値を入力してください。";
      } else if (!Number.isInteger(value) || value < Number(input.min || 0)) {
        message = `${input.min || 0}以上の整数を入力してください。`;
      }

      setError(name, message);
      valid = valid && !message;
    }

    let rateTotal = 0;
    for (const name of RATE_FIELDS) {
      const rate = Number(field(name).value);
      let rateError = "";
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        rateError = "0以上100以下の数値を入力してください。";
      }
      setError(name, rateError);
      valid = valid && !rateError;
      if (!rateError) {
        rateTotal += rate;
      }
    }
    const rate5 = Number(field("rate5").value);
    const targetRate5 = Number(field("targetRate5").value);
    let targetRateError = "";
    if (
      !Number.isFinite(targetRate5) ||
      targetRate5 < 0 ||
      targetRate5 > 100
    ) {
      targetRateError = "0以上100以下の数値を入力してください。";
    }
    if (
      !targetRateError &&
      Number.isFinite(rate5) &&
      targetRate5 > rate5
    ) {
      const topLabel = rarityLabels.rarityLabel5 || DEFAULTS.rarityLabel5;
      targetRateError = `狙いの${topLabel}排出率は、${topLabel}全体以下にしてください。`;
    }
    setError("targetRate5", targetRateError);
    valid = valid && !targetRateError;
    document.querySelector("#rate-total").textContent = rateTotal.toFixed(2);
    const ratesComplete = Math.abs(rateTotal - 100) < 0.000001;
    const rateTotalError = document.querySelector("#rate-total-error");
    rateTotalError.textContent = ratesComplete
      ? ""
      : "ガチャテストを実行するには、排出率の合計を100%にしてください。";
    const simulationReady = ratesComplete && !targetRateError;
    simulateButton.disabled = !simulationReady;
    statisticsButton.disabled = !simulationReady;
    if (!ratesComplete) {
      valid = false;
    }

    if (
      field("ceilingMode").value === "pity" &&
      !document.querySelector('[data-error-for="currentPity"]').textContent &&
      !document.querySelector('[data-error-for="ceiling"]').textContent &&
      integerValue("currentPity") > integerValue("ceiling")
    ) {
      setError("currentPity", "天井回数以下にしてください。");
      valid = false;
    }

    if (
      integerValue("softPityStart") > 0 &&
      !document.querySelector('[data-error-for="softPityStart"]').textContent &&
      !document.querySelector('[data-error-for="ceiling"]').textContent &&
      integerValue("softPityStart") >= integerValue("ceiling")
    ) {
      setError("softPityStart", "天井回数より小さい回数にしてください。");
      valid = false;
    }

    const startDateValue = field("startDate").value;
    const endDateValue = field("endDate").value;
    setError("startDate", "");
    if (startDateValue && endDateValue) {
      const startDate = new Date(startDateValue);
      const endDate = new Date(endDateValue);
      if (
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        startDate.getTime() > endDate.getTime()
      ) {
        setError("startDate", "終了日より前にしてください。");
        valid = false;
      }
    }

    return valid;
  }

  function updateBadge(element, reachable) {
    element.textContent = reachable ? "天井に届きます" : "天井まで不足";
    element.classList.toggle("warning", !reachable);
    element.classList.remove("neutral");
  }

  function getCalculationInput(stones, tickets) {
    return {
      stones,
      tickets,
      drawsPerTicket: integerValue("drawsPerTicket"),
      singleCost: integerValue("singleCost"),
      tenCost: integerValue("tenCost"),
      ceiling: integerValue("ceiling"),
      currentPity: integerValue("currentPity"),
    };
  }

  function getExchangeInput(stones, tickets) {
    return {
      stones,
      tickets,
      drawsPerTicket: integerValue("drawsPerTicket"),
      singleCost: integerValue("singleCost"),
      tenCost: integerValue("tenCost"),
      exchangeCost: integerValue("exchangeCost"),
      currentPoints: integerValue("currentPoints"),
    };
  }

  function getTargetPityInput(stones, tickets) {
    const rates = getRarityRates();
    const targetRate = Number(field("targetRate5").value) || 0;
    return {
      stones,
      tickets,
      drawsPerTicket: integerValue("drawsPerTicket"),
      singleCost: integerValue("singleCost"),
      tenCost: integerValue("tenCost"),
      hardPity: integerValue("ceiling"),
      currentPity: integerValue("currentPity"),
      targetCopies: integerValue("targetCopies"),
      guaranteeAfterMiss: booleanFieldValue("guaranteeAfterMiss"),
      featuredGuaranteed: booleanFieldValue("featuredGuaranteed"),
      targetAlwaysOnStar5: rates.star5 > 0 && targetRate >= rates.star5,
    };
  }

  function renderTargetPityStatus(stones, tickets) {
    const targetStatus = GachaCalculator.targetPityStatus(
      getTargetPityInput(stones, tickets)
    );
    if (!targetStatus.guaranteed) {
      setText("target-guaranteed-draws", "確定不可");
      setText("target-stones-needed", "-");
      setText("target-stone-shortage", "-");
      return;
    }
    setText("target-guaranteed-draws", targetStatus.guaranteedDrawsNeeded);
    setText("target-stones-needed", targetStatus.stonesNeeded);
    setText("target-stone-shortage", targetStatus.stoneShortage);
  }

  function renderTargetExchangeStatus(stones, tickets) {
    const targetStatus = GachaCalculator.targetExchangeStatus({
      ...getExchangeInput(stones, tickets),
      targetCopies: integerValue("targetCopies"),
    });
    setText("target-points-needed", targetStatus.pointsNeeded);
    setText("target-point-stones-needed", targetStatus.stonesNeeded);
    setText("target-point-shortage", targetStatus.stoneShortage);
  }

  function updateModeVisibility() {
    const selected = hasSelectedPreset();
    document.body.dataset.hasPreset = selected ? "true" : "false";
    for (const tab of appTabs) {
      const locked =
        !selected && LOCKED_TABS_WITHOUT_PRESET.includes(tab.dataset.tab);
      tab.disabled = locked;
      tab.setAttribute("aria-disabled", String(locked));
    }
    if (
      !selected &&
      LOCKED_TABS_WITHOUT_PRESET.includes(document.body.dataset.activeTab)
    ) {
      setActiveTab("calculator");
    }

    const featuredField = field("featuredGuaranteed").closest(".checkbox-field");
    const showFeaturedField = selected && presetSupportsFeaturedGuarantee();
    featuredField.hidden = !showFeaturedField;
    if (!showFeaturedField) {
      setBooleanField("featuredGuaranteed", false);
    }

    const pointMode = field("ceilingMode").value === "points";
    const pityFields = [
      field("ceiling").closest(".field"),
      field("currentPity").closest(".field"),
    ];

    for (const element of pityFields) {
      element.hidden = pointMode;
    }
    for (const element of document.querySelectorAll(".point-field")) {
      element.hidden = !pointMode;
    }
    document.querySelector("#pity-results").hidden = pointMode;
    document.querySelector("#point-results").hidden = !pointMode;
    document.querySelector("#forecast-pity-results").hidden = pointMode;
    document.querySelector("#forecast-point-results").hidden = !pointMode;
  }

  function getRarityRates() {
    return Object.fromEntries(
      getRarityDefinitions().map((rarity) => [
        rarity.key,
        Number(field(rarity.field).value) || 0,
      ])
    );
  }

  function getSimulationRates() {
    const rates = getRarityRates();
    const targetRate = Number(field("targetRate5").value) || 0;
    return {
      target5: targetRate,
      star5Other: Math.max(0, rates.star5 - targetRate),
      star4: rates.star4,
      star3: rates.star3,
      star2: rates.star2,
    };
  }

  function getFeaturedPityOptions() {
    const softPityStart = integerValue("softPityStart");
    const guaranteeAfterMiss = booleanFieldValue("guaranteeAfterMiss");
    const featuredGuaranteed = booleanFieldValue("featuredGuaranteed");
    if (!softPityStart && !guaranteeAfterMiss && !featuredGuaranteed) {
      return null;
    }
    return {
      currentPity: integerValue("currentPity"),
      softPityStart,
      hardPity: integerValue("ceiling"),
      guaranteeAfterMiss,
      featuredGuaranteed,
    };
  }

  function getSimulationRarities() {
    const rates = getSimulationRates();
    const topLabel = rarityLabels.rarityLabel5 || DEFAULTS.rarityLabel5;
    return [
      {
        key: "target5",
        label: `狙いの${topLabel}`,
        className: "star5 target",
      },
      { key: "star5Other", label: `その他${topLabel}`, className: "star5" },
      { key: "star4", label: rarityLabels.rarityLabel4, className: "star4" },
      { key: "star3", label: rarityLabels.rarityLabel3, className: "star3" },
      { key: "star2", label: rarityLabels.rarityLabel2, className: "star2" },
    ].filter((rarity) => rates[rarity.key] > 0);
  }

  function createEmptyRarityResults() {
    return Object.fromEntries(
      Object.keys(getSimulationRates()).map((key) => [key, 0])
    );
  }

  function getSingleDrawResult(rates, featuredPity) {
    const result = featuredPity
      ? GachaCalculator.simulateFeaturedPityRarities(1, rates, featuredPity)
      : GachaCalculator.simulateRarities(1, rates);
    return Object.keys(result).find((key) => result[key] > 0 && key !== "other");
  }

  function updateFeaturedPityAfterDraw(featuredPity, rarityKey) {
    if (!featuredPity) {
      return;
    }
    if (rarityKey === "target5") {
      featuredPity.currentPity = 0;
      featuredPity.featuredGuaranteed = false;
      return;
    }
    if (rarityKey === "star5Other") {
      featuredPity.currentPity = 0;
      featuredPity.featuredGuaranteed = Boolean(featuredPity.guaranteeAfterMiss);
      return;
    }
    featuredPity.currentPity += 1;
  }

  function runTargetedSimulation() {
    const stones = integerValue("stones");
    const tickets = integerValue("tickets");
    const drawsPerTicket = Math.max(1, integerValue("drawsPerTicket"));
    const singleCost = integerValue("singleCost");
    const tenCost = integerValue("tenCost");
    const stonePlan = GachaCalculator.optimalStonePlan(
      stones,
      singleCost,
      tenCost
    );
    const drawsFromTickets = GachaCalculator.ticketDraws(
      tickets,
      drawsPerTicket
    );
    const totalDraws = stonePlan.draws + drawsFromTickets;
    const rates = getSimulationRates();
    const featuredPityOptions = getFeaturedPityOptions();
    const featuredPity = featuredPityOptions ? { ...featuredPityOptions } : null;
    const rarityResults = createEmptyRarityResults();
    const pointMode = field("ceilingMode").value === "points";
    const targetCopies = integerValue("targetCopies");
    const exchangeCost = Math.max(1, integerValue("exchangeCost"));
    const currentPoints = integerValue("currentPoints");
    let targetHits = 0;
    let targetTotal = 0;
    let drawsUsed = 0;

    for (let drawIndex = 0; drawIndex < totalDraws; drawIndex += 1) {
      const rarityKey = getSingleDrawResult(rates, featuredPity);
      if (rarityKey) {
        rarityResults[rarityKey] = (rarityResults[rarityKey] || 0) + 1;
      }
      updateFeaturedPityAfterDraw(featuredPity, rarityKey);
      drawsUsed += 1;
      targetHits = rarityResults.target5 || rarityResults.star5 || 0;
      targetTotal = targetHits;

      if (pointMode) {
        targetTotal += Math.floor((currentPoints + drawsUsed) / exchangeCost);
      }
      if (targetTotal >= targetCopies) {
        break;
      }
    }

    const ticketDrawsUsed = Math.min(drawsUsed, drawsFromTickets);
    const usedTickets = Math.ceil(ticketDrawsUsed / drawsPerTicket);
    const stoneDrawsUsed = Math.max(0, drawsUsed - drawsFromTickets);
    const spentStones = GachaCalculator.minStonesForDraws(
      stoneDrawsUsed,
      singleCost,
      tenCost
    );

    return {
      draws: drawsUsed,
      rarityResults,
      spentStones,
      usedTickets,
      remainingStones: Math.max(0, stones - spentStones),
      remainingTickets: Math.max(0, tickets - usedTickets),
      pointsAfterSimulation: currentPoints + drawsUsed,
      targetTotal,
      targetShortage: Math.max(0, targetCopies - targetTotal),
    };
  }

  function renderProbabilityStats(totalDraws) {
    const rates = getRarityRates();
    const rateTotal = Object.values(rates).reduce(
      (sum, rate) => sum + rate,
      0
    );
    document.querySelector("#rate-total").textContent = rateTotal.toFixed(2);
    const simulationRates = getSimulationRates();
    const featuredPity = getFeaturedPityOptions();
    const pityStats = featuredPity
      ? GachaCalculator.featuredPityProbabilityStats(
          totalDraws,
          simulationRates,
          featuredPity
        )
      : null;
    const probabilityRows = getSimulationRarities().map((rarity) => ({
      ...rarity,
      rate: simulationRates[rarity.key],
    }));
    document.querySelector("#probability-table").innerHTML =
      probabilityRows.map((rarity) => {
        const stats =
          pityStats?.[rarity.key] ||
          GachaCalculator.probabilityStats(totalDraws, rarity.rate);
        return `
          <div class="rarity-row rarity-${rarity.className.replaceAll(" ", " rarity-")}">
            <strong>${rarity.label}</strong>
            <span>期待 ${stats.expectedHits.toFixed(2)}体</span>
            <span>1体以上 ${(stats.atLeastOneProbability * 100).toFixed(1)}%</span>
          </div>
        `;
      }
    ).join("");
  }

  function render() {
    if (!validate()) {
      return;
    }

    const stones = integerValue("stones");
    const tickets = integerValue("tickets");
    const singleCost = integerValue("singleCost");
    const tenCost = integerValue("tenCost");
    const drawsPerTicket = integerValue("drawsPerTicket");
    const stoneDraws = GachaCalculator.maxDrawsFromStones(
      stones,
      singleCost,
      tenCost
    );
    const drawsFromTickets = GachaCalculator.ticketDraws(
      tickets,
      drawsPerTicket
    );
    const totalDraws = stoneDraws + drawsFromTickets;
    const pointMode = field("ceilingMode").value === "points";

    setText("current-total-draws", totalDraws);
    setText("current-stone-draws", stoneDraws);
    setText("current-ticket-draws", drawsFromTickets);
    if (pointMode) {
      const pointStatus = GachaCalculator.exchangePointStatus(
        getExchangeInput(stones, tickets)
      );
      setText("current-points", pointStatus.currentPoints);
      setText("points-after-draws", pointStatus.pointsAfterDraws);
      setText("exchangeable-count", pointStatus.exchangeableAfterDraws);
      setText(
        "points-shortage",
        pointStatus.pointsToNextExchange
      );
      updateBadge(
        document.querySelector("#current-status"),
        pointStatus.reachable
      );
      document.querySelector("#current-status").textContent =
        pointStatus.reachable ? "交換できます" : "交換まで不足";
      renderTargetExchangeStatus(stones, tickets);
    } else {
      const currentCeiling = GachaCalculator.ceilingStatus(
        getCalculationInput(stones, tickets)
      );
      setText("current-remaining-draws", currentCeiling.remainingDraws);
      setText("current-stone-needed-draws", currentCeiling.stoneDrawsNeeded);
      setText("current-stones-needed", currentCeiling.stonesNeeded);
      setText("current-shortage", currentCeiling.stoneShortage);
      updateBadge(
        document.querySelector("#current-status"),
        currentCeiling.reachable
      );
      renderTargetPityStatus(stones, tickets);
    }

    renderProbabilityStats(totalDraws);

    renderForecast(stones, tickets, singleCost, tenCost, drawsPerTicket);
  }

  function renderForecast(stones, tickets, singleCost, tenCost, drawsPerTicket) {
    const endDate = field("endDate").value;
    const empty = document.querySelector("#forecast-empty");
    const content = document.querySelector("#forecast-content");
    const badge = document.querySelector("#forecast-status");

    if (!endDate) {
      empty.hidden = false;
      content.hidden = true;
      badge.textContent = "終了日を入力";
      badge.className = "status-badge neutral";
      return;
    }

    const days = GachaCalculator.remainingEarningDays(
      endDate,
      booleanFieldValue("includeToday")
    );
    const bonusTotals = bonusTotalsForForecast();
    const addedStones = integerValue("dailyStones") * days + bonusTotals.stones;
    const addedTickets =
      integerValue("dailyTickets") * days + bonusTotals.tickets;
    const forecastStones = stones + addedStones;
    const forecastTickets = tickets + addedTickets;
    const forecastStoneDraws = GachaCalculator.maxDrawsFromStones(
      forecastStones,
      singleCost,
      tenCost
    );
    const forecastTicketDraws = GachaCalculator.ticketDraws(
      forecastTickets,
      drawsPerTicket
    );
    const pointMode = field("ceilingMode").value === "points";

    empty.hidden = true;
    content.hidden = false;
    setText("remaining-days", days);
    setText("added-stones", addedStones);
    setText("added-tickets", addedTickets);
    setText("forecast-stones", forecastStones);
    setText("forecast-tickets", forecastTickets);
    setText(
      "forecast-total-draws",
      forecastStoneDraws + forecastTicketDraws
    );
    if (pointMode) {
      const pointStatus = GachaCalculator.exchangePointStatus(
        getExchangeInput(forecastStones, forecastTickets)
      );
      setText("forecast-points", pointStatus.pointsAfterDraws);
      setText("forecast-exchangeable", pointStatus.exchangeableAfterDraws);
      updateBadge(badge, pointStatus.reachable);
      badge.textContent = pointStatus.reachable ? "交換できます" : "交換まで不足";
    } else {
      const forecastCeiling = GachaCalculator.ceilingStatus(
        getCalculationInput(forecastStones, forecastTickets)
      );
      setText("forecast-stones-needed", forecastCeiling.stonesNeeded);
      setText("forecast-shortage", forecastCeiling.stoneShortage);
      updateBadge(badge, forecastCeiling.reachable);
    }
  }

  function handleInput() {
    updateModeVisibility();
    saveState();
    render();
  }

  function runSimulation() {
    if (!validate()) {
      return;
    }

    const result = runTargetedSimulation();
    const simulationRarities = getSimulationRarities();
    const rarityTotal = simulationRarities.reduce(
      (sum, rarity) => sum + result.rarityResults[rarity.key],
      0
    );
    if (rarityTotal !== result.draws) {
      throw new Error("抽選結果の合計がガチャ回数と一致しません。");
    }

    document.querySelector("#simulation-rarity-grid").innerHTML =
      simulationRarities.map(
        (rarity) => `
          <div class="simulation-rarity rarity-${rarity.className.replaceAll(" ", " rarity-")}">
            <span>${rarity.label}</span>
            <strong>${numberFormat.format(result.rarityResults[rarity.key])}体</strong>
          </div>
        `
      ).join("");
    setText("simulation-draws", result.draws);
    setText("simulation-spent-stones", result.spentStones);
    setText("simulation-used-tickets", result.usedTickets);
    setText("simulation-remaining-stones", result.remainingStones);
    setText("simulation-remaining-tickets", result.remainingTickets);

    const pointMode = field("ceilingMode").value === "points";
    document.querySelector("#simulation-points-row").hidden = !pointMode;
    if (pointMode) {
      setText("simulation-points", result.pointsAfterSimulation);
    }
    document.querySelector("#simulation-target-status").textContent =
      result.targetShortage === 0
        ? `達成（${numberFormat.format(result.targetTotal)}体）`
        : `不足 ${numberFormat.format(result.targetShortage)}体 / 結果 ${numberFormat.format(result.targetTotal)}体`;

    document.querySelector("#simulation-empty").hidden = true;
    document.querySelector("#simulation-content").hidden = false;
  }

  function formatProbability(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function runStatisticsSimulation() {
    if (!validate()) {
      return;
    }

    const stones = integerValue("stones");
    const tickets = integerValue("tickets");
    const stonePlan = GachaCalculator.optimalStonePlan(
      stones,
      integerValue("singleCost"),
      integerValue("tenCost")
    );
    const totalDraws =
      stonePlan.draws +
      GachaCalculator.ticketDraws(
        tickets,
        integerValue("drawsPerTicket")
      );
    const trials = Number(trialCountSelect.value);
    const simulationRarities = getSimulationRarities();
    const result = GachaCalculator.simulateRarityTrials(
      totalDraws,
      getSimulationRates(),
      trials,
      Math.random,
      { featuredPity: getFeaturedPityOptions() }
    );

    setText("statistics-draws", result.draws);
    setText("statistics-trials", result.trials);
    document.querySelector("#statistics-table-body").innerHTML =
      simulationRarities.map(
      (rarity) => {
        const stats = result.statistics[rarity.key];
        return `
          <tr class="rarity-${rarity.className.replaceAll(" ", " rarity-")}">
            <th>${rarity.label}</th>
            <td>${stats.average.toFixed(2)}</td>
            <td>${numberFormat.format(stats.min)}</td>
            <td>${numberFormat.format(stats.max)}</td>
            <td>${numberFormat.format(stats.lower10)}以下</td>
            <td>${numberFormat.format(stats.upper10)}以上</td>
          </tr>
        `;
      }
    ).join("");
    document.querySelector("#star5-zero").textContent = formatProbability(
      result.star5Probabilities.zero
    );
    document.querySelector("#star5-at-least-1").textContent =
      formatProbability(result.star5Probabilities.atLeast1);
    document.querySelector("#star5-at-least-3").textContent =
      formatProbability(result.star5Probabilities.atLeast3);
    document.querySelector("#star5-at-least-5").textContent =
      formatProbability(result.star5Probabilities.atLeast5);
    document.querySelector("#statistics-empty").hidden = true;
    document.querySelector("#statistics-content").hidden = false;
  }

  form.addEventListener("input", handleInput);
  form.addEventListener("change", handleInput);
  for (const tab of appTabs) {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  }
  saveTemplateButton.addEventListener("click", saveCurrentTemplate);
  loadPresetButton.addEventListener("click", loadSelectedPreset);
  loadTemplateButton.addEventListener("click", loadSelectedTemplate);
  deleteTemplateButton.addEventListener("click", deleteSelectedTemplate);
  downloadBackupButton.addEventListener("click", downloadBackup);
  backupFileInput.addEventListener("change", importBackupFile);
  copyShareButton.addEventListener("click", copyShareCode);
  importShareButton.addEventListener("click", importShareCode);
  addBonusButton.addEventListener("click", addBonusItem);
  bonusList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-bonus]");
    if (deleteButton) {
      deleteBonusItem(deleteButton.dataset.deleteBonus);
    }
  });
  templateSelect.addEventListener("change", () => {
    if (templateSelect.value) {
      templateNameInput.value = templateSelect.value;
    }
  });
  simulateButton.addEventListener("click", runSimulation);
  statisticsButton.addEventListener("click", runStatisticsSimulation);
  resetButton.addEventListener("click", () => {
    applyState(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
    updateModeVisibility();
    render();
    saveIndicator.textContent = "初期値に戻しました";
  });

  renderPresetOptions();
  loadState();
  renderTemplateOptions();
  setupCollapsibleFields();
  setActiveTab(localStorage.getItem(ACTIVE_TAB_KEY) || "calculator");
  updateModeVisibility();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js");
    });
  }
})();
