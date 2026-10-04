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

const SITE_PASSWORD = "1234";

(function gateInit() {
  if (localStorage.getItem(LS_ACCESS) === "yes") {
    const gate = document.getElementById("gate");
    const wrap = document.getElementById("appWrap");
    if (gate) gate.classList.add("hidden");
    if (wrap) wrap.classList.remove("hidden");
    return;
  }
  const gBtn = document.getElementById("gateBtn");
  const gPwd = document.getElementById("gatePwd");
  if (gBtn) gBtn.addEventListener("click", tryUnlock);
  if (gPwd) gPwd.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  
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

let act = loadAct();
if (!act) {
  act = freshAct();
} else {
  if (!act.modules) act.modules = [];
  if (!act.commission) act.commission = { chairman: { role: "", name: "" }, members: [] };
  if (!act.approver) act.approver = { position: "", org: "", name: "" };
}

let currentModuleDraft = null; 

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

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
  window.scrollTo(0, 0);
}
function updateProgress() {
  const box = document.getElementById("actProgress");
  if (!box) return;
  if (act.modules.length === 0 && !act.actNumber) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  
  const pActNum = document.getElementById("progActNumber");
  if (pActNum) pActNum.textContent = act.actNumber || "(без номера)";
  
  const pCount = document.getElementById("progCount");
  if (pCount) pCount.textContent = act.modules.length;
}

const menuBtn = document.getElementById("menuBtn");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    document.getElementById("menuPanel").classList.toggle("hidden");
  });
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#menuBtn") && !e.target.closest("#menuPanel")) {
    const p = document.getElementById("menuPanel");
    if (p) p.classList.add("hidden");
  }
});

const btnEdit = document.getElementById("editSettingsBtn");
if (btnEdit) btnEdit.addEventListener("click", () => {
  document.getElementById("menuPanel").classList.add("hidden");
  fillSettingsForm();
  showScreen("screen-settings");
});

const btnNew = document.getElementById("newActBtn");
if (btnNew) btnNew.addEventListener("click", () => {
  document.getElementById("menuPanel").classList.add("hidden");
  if (!confirm("Начать новый акт? Текущий список телег будет очищен.")) return;
  act = freshAct();
  saveActToStorage();
  fillSettingsForm();
  showScreen("screen-settings");
  updateProgress();
});

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
  return p.role ? `\({p.name} —\){p.role}` : p.name;
}
function fillPicker(selectEl, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = `${esc(placeholder)}` +
    knownPeople().map((p, i) => `${esc(personLabel(p))}`).join("");
}

function renderMembers() {
  const box = document.getElementById("membersBox");
  if (!box) return;
  box.innerHTML = "";
  (act.commission.members || []).forEach((m, i) => {
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML = `