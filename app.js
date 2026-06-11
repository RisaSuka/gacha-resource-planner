(function () {
  "use strict";

  const STORAGE_KEY = "gacha-resource-planner:v1";
  const TEMPLATE_STORAGE_KEY = "gacha-resource-planner:templates:v1";
  const BACKUP_FORMAT = "gacha-resource-planner-backup";
  const BACKUP_VERSION = 1;
  const DEFAULTS = {
    stones: "0",
    tickets: "0",
    drawsPerTicket: "1",
    singleCost: "100",
    tenCost: "1000",
    ceiling: "200",
    currentPity: "0",
    endDate: "",
    dailyStones: "0",
    dailyTickets: "0",
    exchangeCost: "300",
    currentPoints: "0",
    rate5: "1",
    rate4: "9",
    rate3: "40",
    rate2: "50",
    ceilingMode: "pity",
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
    "dailyStones",
    "dailyTickets",
    "exchangeCost",
    "currentPoints",
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
    "rate4",
    "rate3",
    "rate2",
    "endDate",
    "ceilingMode",
    "includeToday",
  ];
  const RARITIES = [
    { key: "star5", field: "rate5", label: "★5" },
    { key: "star4", field: "rate4", label: "★4" },
    { key: "star3", field: "rate3", label: "★3" },
    { key: "star2", field: "rate2", label: "★2" },
  ];

  const form = document.querySelector("#calculator-form");
  const resetButton = document.querySelector("#reset-button");
  const simulateButton = document.querySelector("#simulate-button");
  const statisticsButton = document.querySelector("#statistics-button");
  const trialCountSelect = document.querySelector("#trial-count");
  const saveIndicator = document.querySelector("#save-indicator");
  const templateNameInput = document.querySelector("#template-name");
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
  const numberFormat = new Intl.NumberFormat("ja-JP");
  let saveIndicatorTimer;
  let templateMessageTimer;
  let dataMessageTimer;

  function field(name) {
    return form.elements.namedItem(name);
  }

  function setText(id, value) {
    document.querySelector(`#${id}`).textContent = numberFormat.format(value);
  }

  function readState() {
    const state = {};
    for (const name of NUMERIC_FIELDS) {
      state[name] = field(name).value;
    }
    state.endDate = field("endDate").value;
    for (const name of RATE_FIELDS) {
      state[name] = field(name).value;
    }
    state.ceilingMode = field("ceilingMode").value;
    state.includeToday = field("includeToday").checked;
    return state;
  }

  function applyState(state) {
    const merged = { ...DEFAULTS, ...state };
    for (const name of NUMERIC_FIELDS) {
      field(name).value = merged[name];
    }
    field("endDate").value = merged.endDate;
    if (state && state.dropRate !== undefined && state.rate5 === undefined) {
      merged.rate5 = state.dropRate;
    }
    for (const name of RATE_FIELDS) {
      field(name).value = merged[name];
    }
    field("ceilingMode").value = merged.ceilingMode;
    field("includeToday").checked = Boolean(merged.includeToday);
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
    document.querySelector("#rate-total").textContent = rateTotal.toFixed(2);
    const ratesComplete = Math.abs(rateTotal - 100) < 0.000001;
    const rateTotalError = document.querySelector("#rate-total-error");
    rateTotalError.textContent = ratesComplete
      ? ""
      : "ガチャテストを実行するには、排出率の合計を100%にしてください。";
    simulateButton.disabled = !ratesComplete;
    statisticsButton.disabled = !ratesComplete;
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

  function updateModeVisibility() {
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
      RARITIES.map((rarity) => [
        rarity.key,
        Number(field(rarity.field).value) || 0,
      ])
    );
  }

  function renderProbabilityStats(totalDraws) {
    const rates = getRarityRates();
    const rateTotal = Object.values(rates).reduce(
      (sum, rate) => sum + rate,
      0
    );
    document.querySelector("#rate-total").textContent = rateTotal.toFixed(2);
    document.querySelector("#probability-table").innerHTML = RARITIES.map(
      (rarity) => {
        const stats = GachaCalculator.probabilityStats(
          totalDraws,
          rates[rarity.key]
        );
        return `
          <div class="rarity-row rarity-${rarity.key}">
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
      badge.textContent = "終了日時を入力";
      badge.className = "status-badge neutral";
      return;
    }

    const days = GachaCalculator.remainingEarningDays(
      endDate,
      field("includeToday").checked
    );
    const addedStones = integerValue("dailyStones") * days;
    const addedTickets = integerValue("dailyTickets") * days;
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

    const stones = integerValue("stones");
    const tickets = integerValue("tickets");
    const drawsPerTicket = integerValue("drawsPerTicket");
    const stonePlan = GachaCalculator.optimalStonePlan(
      stones,
      integerValue("singleCost"),
      integerValue("tenCost")
    );
    const drawsFromTickets = GachaCalculator.ticketDraws(
      tickets,
      drawsPerTicket
    );
    const totalDraws = stonePlan.draws + drawsFromTickets;
    const rarityResults = GachaCalculator.simulateRarities(
      totalDraws,
      getRarityRates()
    );
    const rarityTotal = RARITIES.reduce(
      (sum, rarity) => sum + rarityResults[rarity.key],
      0
    );
    if (rarityTotal !== totalDraws) {
      throw new Error("抽選結果の合計がガチャ回数と一致しません。");
    }

    document.querySelector("#simulation-rarity-grid").innerHTML =
      RARITIES.map(
        (rarity) => `
          <div class="simulation-rarity rarity-${rarity.key}">
            <span>${rarity.label}</span>
            <strong>${numberFormat.format(rarityResults[rarity.key])}体</strong>
          </div>
        `
      ).join("");
    setText("simulation-draws", totalDraws);
    setText("simulation-spent-stones", stonePlan.spentStones);
    setText("simulation-used-tickets", tickets);
    setText("simulation-remaining-stones", stonePlan.remainingStones);

    const pointMode = field("ceilingMode").value === "points";
    document.querySelector("#simulation-points-row").hidden = !pointMode;
    if (pointMode) {
      setText(
        "simulation-points",
        integerValue("currentPoints") + totalDraws
      );
    }

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
    const result = GachaCalculator.simulateRarityTrials(
      totalDraws,
      getRarityRates(),
      trials
    );

    setText("statistics-draws", result.draws);
    setText("statistics-trials", result.trials);
    document.querySelector("#statistics-table-body").innerHTML = RARITIES.map(
      (rarity) => {
        const stats = result.statistics[rarity.key];
        return `
          <tr class="rarity-${rarity.key}">
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
  saveTemplateButton.addEventListener("click", saveCurrentTemplate);
  loadTemplateButton.addEventListener("click", loadSelectedTemplate);
  deleteTemplateButton.addEventListener("click", deleteSelectedTemplate);
  downloadBackupButton.addEventListener("click", downloadBackup);
  backupFileInput.addEventListener("change", importBackupFile);
  copyShareButton.addEventListener("click", copyShareCode);
  importShareButton.addEventListener("click", importShareCode);
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

  loadState();
  renderTemplateOptions();
  updateModeVisibility();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js");
    });
  }
})();
