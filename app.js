const DEFECTS_CATALOG = [
  { key: "akb30", label: "Заряд АКБ более 30%", text: "Заряд АКБ более 30%.", photo: false },
  { key: "rust", label: "Следы ржавчины на щупе редуктора", text: "Следы ржавчины на щупе редуктора", photo: true },
  { key: "reducer_unreadable", label: "Нечитаемый номер редуктора", text: "Нечитаемый номер редуктора", photo: false },
  { key: "bolts", label: "Болты крепления муфт не соответствуют КД", text: "Болты крепления муфт не соответствуют КД", photo: true },
  { key: "winch", label: "Лебёдка Novawinch Fenix 2500 — несоответствие зав.№", text: "По паспорту лебедка Novawinch Fenix 2500 с соленоидом зав. № _____, фактически установлена зав. № _____", photo: true },
  { key: "battery_sn", label: "Электробатарея Andersen SB120A-600V — несоответствие зав.№", text: "По паспорту электробатарея с ответными частями разъемов Andersen SB120A-600V (2 разъема), 232 А/ч зав. № _____, фактически установлена зав. № _____", photo: false },
  { key: "battery_broken", label: "Электробатарея неработоспособна", text: "Электробатарея неработоспособна (уточнить причину)", photo: false },
  { key: "lkp", label: "Местное нарушение ЛКП", text: "Местное нарушение ЛКП", photo: true },
  { key: "board", label: "Борт не закрывается", text: "Борт не закрывается", photo: true },
  { key: "akb_label", label: "Отсутствует этикетка на АКБ", text: "Отсутствует этикетка на АКБ 72В", photo: false },
  { key: "camera_straps", label: "В чехле для блока камер отсутствуют ленты крепления", text: "В чехле для блока камер отсутствуют ленты крепления", photo: false },
  { key: "shplint", label: "Нарушена соосность крепления шплинтов", text: "Отсутствует соосность в месте крепления шплинтов", photo: true },
  { key: "coupling_dia", label: "Несоответствие диаметра вала муфт/двигателей", text: "Установлены муфты с диаметром вала _____мм, двигатели с диаметром вала _____мм.", photo: false },
  { key: "other", label: "Другое (свой текст)", text: "", photo: false },
];

const LS_SETTINGS = "ic_settings_v1";
const LS_ACT = "ic_current_act_v1";
const LS_ACCESS = "ic_access_ok_v1";

// ---------- простой пароль на вход (НЕ настоящая защита — код сайта публичный) ----------
// Поменяйте это значение на свой пароль перед загрузкой файлов на хостинг.
const SITE_PASSWORD = "1234";

(function gateInit() {
  if (localStorage.getItem(LS_ACCESS) === "yes") {
    document.getElementById("gate").classList.add("hidden");
    document.getElementById("appWrap").classList.remove("hidden");
    return;
  }
  document.getElementById("gateBtn").addEventListener("click", tryUnlock);
  document.getElementById("gatePwd").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  function tryUnlock() {
    const v = document.getElementById("gatePwd").value;
    if (v === SITE_PASSWORD) {
      localStorage.setItem(LS_ACCESS, "yes");
      document.getElementById("gate").classList.add("hidden");
      document.getElementById("appWrap").classList.remove("hidden");
    } else {
      document.getElementById("gateErr").textContent = "Неверный пароль";
      document.getElementById("gatePwd").value = "";
    }
  }
})();

let settings = loadSettings();
let act = loadAct() || freshAct();
let currentModuleDraft = null; // {number, components:{...}, defects:[{key,text,photoFile}]}

function freshAct() {
  return {
    actNumber: settings.actNumber || "",
    platformsCount: settings.platformsCount || "",
    contractInfo: settings.contractInfo || "",
    approver: settings.approver || { position: "", org: "", name: "" },
    commission: settings.commission || { chairman: { role: "", name: "" }, members: [] },
    modules: [],
  };
}
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(LS_SETTINGS)) || {}; } catch (e) { return {}; }
}
function saveSettingsToStorage() { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); }
function loadAct() {
  try { return JSON.parse(localStorage.getItem(LS_ACT)); } catch (e) { return null; }
}
function saveActToStorage() { localStorage.setItem(LS_ACT, JSON.stringify(act)); }

// ---------- navigation ----------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  window.scrollTo(0, 0);
}
function updateProgress() {
  const box = document.getElementById("actProgress");
  if (act.modules.length === 0 && !act.actNumber) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  document.getElementById("progActNumber").textContent = act.actNumber || "(без номера)";
  document.getElementById("progCount").textContent = act.modules.length;
}

// ---------- menu ----------
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("menuPanel").classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#menuBtn") && !e.target.closest("#menuPanel")) {
    document.getElementById("menuPanel").classList.add("hidden");
  }
});
document.getElementById("editSettingsBtn").addEventListener("click", () => {
  document.getElementById("menuPanel").classList.add("hidden");
  fillSettingsForm();
  showScreen("screen-settings");
});
document.getElementById("newActBtn").addEventListener("click", () => {
  document.getElementById("menuPanel").classList.add("hidden");
  if (!confirm("Начать новый акт? Текущий список телег (если не сформирован файл) будет очищен.")) return;
  act = freshAct();
  saveActToStorage();
  fillSettingsForm();
  showScreen("screen-settings");
  updateProgress();
});

// ---------- known people (saved list for pickers) ----------
function knownPeople() {
  return settings.knownPeople || [];
}
function rememberPerson(role, name) {
  if (!name || !name.trim()) return;
  settings.knownPeople = settings.knownPeople || [];
  const exists = settings.knownPeople.some((p) => p.name === name && p.role === role);
  if (!exists) settings.knownPeople.push({ role: role || "", name });
}
function personLabel(p) {
  return p.role ? `${p.name} — ${p.role}` : p.name;
}
function fillPicker(selectEl, placeholder) {
  selectEl.innerHTML = `<option value="">${esc(placeholder)}</option>` +
    knownPeople().map((p, i) => `<option value="${i}">${esc(personLabel(p))}</option>`).join("");
}

// ---------- members ----------
function renderMembers() {
  const box = document.getElementById("membersBox");
  box.innerHTML = "";
  (act.commission.members || []).forEach((m, i) => {
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML = `
      <div class="field"><label>Должность</label><input class="mRole" data-i="${i}" value="${esc(m.role)}" /></div>
      <div class="field"><label>ФИО</label><input class="mName" data-i="${i}" value="${esc(m.name)}" /></div>
      <button type="button" class="btn-danger" data-i="${i}">✕</button>
    `;
    box.appendChild(row);
  });
  box.querySelectorAll(".mRole").forEach((el) => el.addEventListener("input", (e) => (act.commission.members[e.target.dataset.i].role = e.target.value)));
  box.querySelectorAll(".mName").forEach((el) => el.addEventListener("input", (e) => (act.commission.members[e.target.dataset.i].name = e.target.value)));
  box.querySelectorAll(".btn-danger").forEach((el) => el.addEventListener("click", (e) => { act.commission.members.splice(e.target.dataset.i, 1); renderMembers(); }));
  fillPicker(document.getElementById("memberPicker"), "— выбрать из списка —");
  fillPicker(document.getElementById("chairPicker"), "— выбрать из списка —");
}
document.getElementById("addMemberBtn").addEventListener("click", () => {
  act.commission.members = act.commission.members || [];
  act.commission.members.push({ role: "", name: "" });
  renderMembers();
});
document.getElementById("memberPicker").addEventListener("change", (e) => {
  const idx = e.target.value;
  if (idx === "") return;
  const p = knownPeople()[idx];
  act.commission.members = act.commission.members || [];
  act.commission.members.push({ role: p.role, name: p.name });
  renderMembers();
  e.target.value = "";
});
document.getElementById("chairPicker").addEventListener("change", (e) => {
  const idx = e.target.value;
  if (idx === "") return;
  const p = knownPeople()[idx];
  val("chairRole", p.role);
  val("chairName", p.name);
});

// ---------- settings screen ----------
function fillSettingsForm() {
  val("actNumber", act.actNumber);
  val("platformsCount", act.platformsCount);
  val("contractInfo", act.contractInfo);
  val("approverPosition", act.approver.position);
  val("approverOrg", act.approver.org);
  val("approverName", act.approver.name);
  val("chairRole", act.commission.chairman.role);
  val("chairName", act.commission.chairman.name);
  val("inspectorName", settings.inspectorName || "");
  val("sheetUrl", settings.sheetUrl || "");
  renderMembers();
}
function readSettingsForm() {
  act.actNumber = val("actNumber");
  act.platformsCount = val("platformsCount");
  act.contractInfo = val("contractInfo");
  act.approver = { position: val("approverPosition"), org: val("approverOrg"), name: val("approverName") };
  act.commission.chairman = { role: val("chairRole"), name: val("chairName") };
  rememberPerson(act.approver.position, act.approver.name);
  rememberPerson(act.commission.chairman.role, act.commission.chairman.name);
  (act.commission.members || []).forEach((m) => rememberPerson(m.role, m.name));
  settings.actNumber = act.actNumber;
  settings.platformsCount = act.platformsCount;
  settings.contractInfo = act.contractInfo;
  settings.approver = act.approver;
  settings.commission = act.commission;
  settings.inspectorName = val("inspectorName");
  settings.sheetUrl = val("sheetUrl");
}
document.getElementById("startBtn").addEventListener("click", () => {
  readSettingsForm();
  saveSettingsToStorage();
  saveActToStorage();
  updateProgress();
  showScreen("screen-module");
});

// ---------- module number ----------
document.getElementById("toComponentsBtn").addEventListener("click", () => {
  const n = val("moduleNumber");
  if (!n) { alert("Укажите номер телеги"); return; }
  currentModuleDraft = { number: n, components: {}, defects: [] };
  document.getElementById("compModuleNumber").textContent = n;
  val("cShaft", "");
  resetComponentGroups();
  showScreen("screen-components");
});
document.getElementById("backToModuleBtn").addEventListener("click", () => showScreen("screen-module"));

// ---------- components: dynamic number fields per unit count ----------
function resetComponentGroups() {
  document.querySelectorAll(".comp-group").forEach((group) => {
    const qtyInput = group.querySelector(".compQty");
    qtyInput.value = 0;
    renderCompNumbers(group, 0);
    qtyInput.oninput = () => renderCompNumbers(group, parseInt(qtyInput.value, 10) || 0);
  });
}
function renderCompNumbers(group, qty) {
  const box = group.querySelector(".compNumbers");
  const prevValues = Array.from(box.querySelectorAll("input")).map((i) => i.value);
  box.innerHTML = "";
  for (let i = 0; i < qty; i++) {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML = `<label>Номер ${i + 1}</label><input class="compNumInput" value="${esc(prevValues[i] || "")}" placeholder="48000602" />`;
    box.appendChild(field);
  }
}
function readComponentGroup(key) {
  const group = document.querySelector(`.comp-group[data-comp="${key}"]`);
  const qty = parseInt(group.querySelector(".compQty").value, 10) || 0;
  const numbers = Array.from(group.querySelectorAll(".compNumInput")).map((i) => i.value.trim()).filter(Boolean);
  if (qty === 0 && numbers.length === 0) return "";
  return `${qty}шт: ${numbers.join(" / ")}`;
}

// ---------- components → defects ----------
document.getElementById("toDefectsBtn").addEventListener("click", () => {
  currentModuleDraft.components = {
    motor: readComponentGroup("motor"),
    shaft: val("cShaft"),
    reducer: readComponentGroup("reducer"),
    winch: readComponentGroup("winch"),
    andersen: readComponentGroup("andersen"),
  };
  document.getElementById("defModuleNumber").textContent = currentModuleDraft.number;
  renderCatalog();
  showScreen("screen-defects");
});
document.getElementById("backToComponentsBtn").addEventListener("click", () => showScreen("screen-components"));

// ---------- defects catalog ----------
function renderCatalog() {
  const box = document.getElementById("defectsCatalog");
  box.innerHTML = "";
  DEFECTS_CATALOG.forEach((d) => {
    const row = document.createElement("div");
    row.className = "defect-row";
    row.innerHTML = `
      <label>
        <input type="checkbox" class="dCheck" data-key="${d.key}" />
        <span>${esc(d.label)}</span>
      </label>
      <textarea class="dText" data-key="${d.key}" placeholder="${d.key === "other" ? "Опишите несоответствие" : ""}">${esc(d.text)}</textarea>
    `;
    box.appendChild(row);
    const chk = row.querySelector(".dCheck");
    chk.addEventListener("change", () => row.classList.toggle("checked", chk.checked));
  });
}

document.getElementById("toPhotosBtn").addEventListener("click", () => {
  const defects = [];
  document.querySelectorAll(".dCheck:checked").forEach((chk) => {
    const key = chk.dataset.key;
    const text = document.querySelector(`.dText[data-key="${key}"]`).value.trim();
    if (text) defects.push({ key, text, photoDataUrl: null, photoExt: null });
  });
  if (defects.length === 0) { alert("Отметьте хотя бы одно несоответствие (или вернитесь назад, если их нет)"); return; }
  currentModuleDraft.defects = defects;
  document.getElementById("photoModuleNumber").textContent = currentModuleDraft.number;
  renderPhotosList();
  showScreen("screen-photos");
});
document.getElementById("backToDefectsBtn").addEventListener("click", () => showScreen("screen-defects"));

// ---------- photos ----------
function renderPhotosList() {
  const box = document.getElementById("photosList");
  box.innerHTML = "";
  currentModuleDraft.defects.forEach((d, i) => {
    const row = document.createElement("div");
    row.className = "photo-item";
    row.innerHTML = `
      <div class="dtext">${esc(d.text)}</div>
      <input type="file" accept="image/*" capture="environment" data-i="${i}" />
    `;
    box.appendChild(row);
    row.querySelector("input[type=file]").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) { currentModuleDraft.defects[i].photoDataUrl = null; return; }
      compressImageToDataUrl(file).then((dataUrl) => {
        currentModuleDraft.defects[i].photoDataUrl = dataUrl;
        currentModuleDraft.defects[i].photoExt = "jpg";
      });
    });
  });
}

document.getElementById("saveModuleBtn").addEventListener("click", async () => {
  act.modules.push(currentModuleDraft);
  saveActToStorage();
  updateProgress();
  document.getElementById("savedModuleNumber").textContent = currentModuleDraft.number;
  renderModulesSummary();
  showScreen("screen-saved");
  await sendRowToSheet(currentModuleDraft);
  currentModuleDraft = null;
});

function renderModulesSummary() {
  const box = document.getElementById("modulesSummary");
  box.innerHTML = act.modules.map((m) => `<div class="module-chip">Телега №${esc(m.number)} — несоответствий: ${m.defects.length}</div>`).join("");
}

document.getElementById("continueBtn").addEventListener("click", () => {
  val("moduleNumber", "");
  showScreen("screen-module");
});

// ---------- Google Sheets ----------
async function sendRowToSheet(mod) {
  const statusEl = document.getElementById("sheetRowStatus");
  if (!settings.sheetUrl) { statusEl.textContent = ""; return; }
  statusEl.textContent = "Отправка строки в Google Таблицу…";
  statusEl.className = "status-msg";
  try {
    const row = {
      actNumber: act.actNumber,
      moduleNumber: mod.number,
      motor: mod.components.motor || "",
      shaft: mod.components.shaft || "",
      reducer: mod.components.reducer || "",
      winch: mod.components.winch || "",
      andersen: mod.components.andersen || "",
      defects: mod.defects.map((d) => d.text).join("; "),
      inspector: settings.inspectorName || "",
    };
    await fetch(settings.sheetUrl, {
      method: "POST",
      mode: "no-cors", // Apps Script web apps commonly require this; we can't read the response, but the write still happens
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(row),
    });
    statusEl.textContent = "Строка отправлена в Google Таблицу ✓ (проверьте таблицу, если это первая отправка)";
    statusEl.classList.add("ok");
  } catch (e) {
    statusEl.textContent = "Не удалось отправить в Google Таблицу (нет интернета?) — данные остаются в акте.";
    statusEl.classList.add("err");
  }
}

// ---------- generate docx ----------
document.getElementById("finishBtn").addEventListener("click", async () => {
  if (act.modules.length === 0) { alert("Добавьте хотя бы одну телегу"); return; }
  document.getElementById("finishBtn").textContent = "Формирование…";
  try {
    const blob = await buildActDocx(act);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Акт_${act.actNumber || "без_номера"}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (e) {
    console.error(e);
    alert("Ошибка при формировании файла: " + e.message);
  } finally {
    document.getElementById("finishBtn").textContent = "Сформировать акт (.docx)";
  }
});

async function buildActDocx(actData) {
  const {
    Document, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType,
    BorderStyle, ImageRun, Packer, Footer, PageNumber, NumberFormat,
  } = docx;
  const NO_BORDERS = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };
  function cell(text, width) {
    return new TableCell({ width: { size: width, type: WidthType.DXA }, borders: NO_BORDERS, children: [new Paragraph({ text: text || "" })] });
  }

  // точные параметры из образца (АКТ_вх_к__8406-БНТС-10): поля страницы, шрифт, межстрочный интервал, отступы
  const BODY = { alignment: AlignmentType.JUSTIFIED, indent: { left: 709, right: 28 }, spacing: { line: 360, lineRule: "auto" } };
  const NUM_REF = "items";

  const children = [];
  children.push(new Paragraph({ text: "УТВЕРЖДАЮ", alignment: AlignmentType.RIGHT }));
  children.push(new Paragraph({ text: actData.approver.position || "", alignment: AlignmentType.RIGHT }));
  children.push(new Paragraph({ text: actData.approver.org || "", alignment: AlignmentType.RIGHT }));
  children.push(new Paragraph({ text: "", alignment: AlignmentType.RIGHT }));
  children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("_______________ " + (actData.approver.name || ""))] }));
  children.push(new Paragraph({ text: "подпись", alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun("«_____» ______________20_____ г.")] }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Акт о выявленном несоответствии № ${actData.actNumber || ""}`, bold: true })],
  }));
  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({
    ...BODY,
    indent: { firstLine: 709 },
    text: `На ${actData.platformsCount || "__"} транспортных платформ по ${actData.contractInfo || ""}`,
  }));
  children.push(new Paragraph({
    spacing: { after: 0, line: 276, lineRule: "auto" },
    indent: { firstLine: 709 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text: "Акт составлен комиссией в составе", bold: true })],
  }));
  children.push(new Paragraph({ text: "" }));

  const commissionRows = [
    new TableRow({ children: [cell("Председатель комиссии", 3000), cell(actData.commission.chairman.role, 4000), cell(actData.commission.chairman.name, 2000)] }),
  ];
  (actData.commission.members || []).forEach((m, i) => {
    commissionRows.push(new TableRow({ children: [cell(i === 0 ? "члены комиссии" : "", 3000), cell(m.role, 4000), cell(m.name, 2000)] }));
  });
  children.push(new Table({ width: { size: 9000, type: WidthType.DXA }, columnWidths: [3000, 4000, 2000], borders: NO_BORDERS, rows: commissionRows }));

  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({
    ...BODY,
    children: [new TextRun({ text: "Описание выявленного несоответствия", bold: true })],
  }));
  children.push(new Paragraph({ text: "" }));

  let photoCounter = 0;
  const photosForAppendix = [];
  for (const mod of actData.modules) {
    children.push(new Paragraph({
      ...BODY,
      numbering: { reference: NUM_REF, level: 0 },
      text: `Гусеничный модуль №${mod.number}`,
    }));
    for (const d of mod.defects) {
      let text = d.text;
      if (d.photoDataUrl) {
        photoCounter += 1;
        text += ` (Приложение А, фотография ${photoCounter}).`;
        const buf = dataUrlToUint8Array(d.photoDataUrl);
        photosForAppendix.push({ number: photoCounter, buf, caption: d.text, ext: d.photoExt || "jpg" });
      } else if (!text.trim().endsWith(".")) {
        text += ".";
      }
      children.push(new Paragraph({
        ...BODY,
        indent: { left: 709, right: 28, firstLine: 0 },
        numbering: { reference: NUM_REF, level: 1 },
        text,
      }));
    }
  }
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({ ...BODY, indent: { firstLine: 709 }, text: "На основании вышеизложенного прошу Вас направить своего представителя для устранения выявленных несоответствий в кратчайшие сроки." }));
  children.push(new Paragraph({ text: "" }));

  const sigRows = [new TableRow({ children: [cell("Председатель", 2500), cell("_______________", 2500), cell(actData.commission.chairman.name, 3000)] })];
  (actData.commission.members || []).forEach((m, i) => {
    sigRows.push(new TableRow({ children: [cell(i === 0 ? "члены комиссии" : "", 2500), cell("_______________", 2500), cell(m.name, 3000)] }));
  });
  children.push(new Table({ width: { size: 8000, type: WidthType.DXA }, columnWidths: [2500, 2500, 3000], borders: NO_BORDERS, rows: sigRows }));

  if (photosForAppendix.length) {
    children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Приложение А", bold: true })] }));
    children.push(new Paragraph({ text: "" }));
    const rows = [];
    for (let i = 0; i < photosForAppendix.length; i += 2) {
      const pair = photosForAppendix.slice(i, i + 2);
      const cells = pair.map((p) => imageCell(p, { TableCell, WidthType, Paragraph, AlignmentType, ImageRun, TextRun, NO_BORDERS }));
      if (pair.length === 1) cells.push(cell("", 4500));
      rows.push(new TableRow({ children: cells }));
    }
    children.push(new Table({ width: { size: 9000, type: WidthType.DXA }, columnWidths: [4500, 4500], borders: NO_BORDERS, rows }));
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 28 } } } },
    numbering: {
      config: [{
        reference: NUM_REF,
        levels: [
          { level: 0, format: "decimal", text: "%1", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 709, hanging: 360 } } } },
          { level: 1, format: "decimal", text: "%1.%2", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 1000, hanging: 420 } } } },
        ],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1276, right: 851, bottom: 1418, left: 1134, header: 709, footer: 709 },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun("Страница "),
              new TextRun({ children: [PageNumber.CURRENT] }),
              new TextRun(" из "),
              new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
            ],
          })],
        }),
      },
      children,
    }],
  });
  return Packer.toBlob(doc);
}

function imageCell(photo, lib) {
  const { TableCell, WidthType, Paragraph, AlignmentType, ImageRun, TextRun } = lib;
  const type = ["jpg", "jpeg"].includes(photo.ext) ? "jpg" : photo.ext === "png" ? "png" : "jpg";
  return new TableCell({
    width: { size: 4500, type: WidthType.DXA },
    borders: lib.NO_BORDERS,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: photo.buf, type, transformation: { width: 260, height: 340 } })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`Фотография ${photo.number} ${photo.caption || ""}`)] }),
    ],
  });
}

// Сжимает фото перед сохранением (до 1000px по большей стороне, JPEG), чтобы акт с
// несколькими фотографиями не весил десятки мегабайт и нормально сохранялся в памяти телефона.
function compressImageToDataUrl(file, maxSide = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSide) { height = Math.round(height * (maxSide / width)); width = maxSide; }
        else if (height >= width && height > maxSide) { width = Math.round(width * (maxSide / height)); height = maxSide; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}
function extOf(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || "");
  return m ? m[1].toLowerCase() : "jpg";
}

// ---------- helpers ----------
function val(id, set) {
  const el = document.getElementById(id);
  if (set !== undefined) { el.value = set || ""; return; }
  return el.value.trim();
}
function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- init ----------
(function init() {
  fillSettingsForm();
  updateProgress();
  if (settings.approver && act.modules.length === 0) {
    // template already saved once — still start at settings screen so user can confirm act number each time
  }
  showScreen("screen-settings");
  renderModulesSummary();
})();
