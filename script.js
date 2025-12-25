(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- UI state for buttons ----------
  const ACTION_LABELS = {
    save: "💾 Сохранить",
    delete: "🗑️ Удалить",
    savePick: "🔎 Сохранить и подобрать варианты",
    pick: "🔎 Подобрать варианты",
  };

  const actionState = {
    // saved = “последние изменения сохранены”
    saved: false,
    // dirty = “после сохранения что-то поменяли”
    dirty: false,
  };

  function isSavedClean() {
    return actionState.saved && !actionState.dirty;
  }

  function setDirty() {
    if (!actionState.dirty) {
      actionState.dirty = true;
      updateActionButtons();
    }
  }

  function setSaved() {
    actionState.saved = true;
    actionState.dirty = false;
    updateActionButtons();
  }

  function setDeleted() {
    actionState.saved = false;
    actionState.dirty = false;
    updateActionButtons();
  }

  function updateActionButtons() {
    const saveBtn = $("#saveBtn");
    const savePickBtn = $("#savePickBtn");
    if (!saveBtn || !savePickBtn) return;

    if (isSavedClean()) {
      // Save -> Delete
      saveBtn.textContent = ACTION_LABELS.delete;
      saveBtn.dataset.mode = "delete";
      saveBtn.classList.add("danger");

      // Save+Pick -> Pick
      savePickBtn.textContent = ACTION_LABELS.pick;
      savePickBtn.dataset.mode = "pick";
    } else {
      // default state
      saveBtn.textContent = ACTION_LABELS.save;
      saveBtn.dataset.mode = "save";
      saveBtn.classList.remove("danger");

      savePickBtn.textContent = ACTION_LABELS.savePick;
      savePickBtn.dataset.mode = "savePick";
    }
  }

  // ---------- Toast ----------
  function showToast(payload) {
    const toast = $("#toast");
    const toastBody = $("#toastBody");
    if (!toast || !toastBody) return;
    toastBody.textContent = JSON.stringify(payload, null, 2);
    toast.classList.add("show");
  }

  function initToast() {
    $("#toastClose")?.addEventListener("click", () => $("#toast")?.classList.remove("show"));
  }

  // ---------- Active toggle (если будет pill/label) ----------
  function initActiveToggle() {
    const activeSel = $("#active");
    const activeLabel = $("#clientActiveLabel");
    if (!activeSel || !activeLabel) return;

    activeSel.addEventListener("change", () => {
      activeLabel.textContent = activeSel.value === "yes" ? "Да" : "Нет";

      const pill = activeLabel.closest(".pill");
      if (!pill) return;

      pill.classList.toggle("ok", activeSel.value === "yes");

      if (activeSel.value === "yes") {
        pill.style.color = "";
        pill.style.borderColor = "";
        pill.style.background = "";
      } else {
        pill.style.color = "var(--danger)";
        pill.style.borderColor = "rgba(239,68,68,.25)";
        pill.style.background = "rgba(239,68,68,.08)";
      }
    });
  }

  // ---------- Phones ----------
  function initPhones() {
    const phonesWrap = $("#phones");
    const addPhoneBtn = $("#addPhoneBtn");
    if (!phonesWrap || !addPhoneBtn) return;

    const phoneRow = (value = "") => {
      const row = document.createElement("div");
      row.className = "row";
      row.style.marginBottom = "10px";
      row.innerHTML = `
        <div class="grow">
          <input placeholder="+380 (__) ___-__-__" value="${String(value).replaceAll('"', "&quot;")}" />
        </div>
        <button class="iconbtn danger" type="button" title="Удалить телефон" aria-label="Удалить">✕</button>
      `;

      // удалить телефон => это изменение
      row.querySelector("button")?.addEventListener("click", () => {
        row.remove();
        setDirty();
      });

      return row;
    };

    addPhoneBtn.addEventListener("click", () => {
      phonesWrap.appendChild(phoneRow(""));
      phonesWrap.querySelector("input:last-of-type")?.focus();
      setDirty();
    });

    // стартовый телефон (не считаем “грязным”)
    phonesWrap.appendChild(phoneRow(""));
  }

  // ---------- Requirements ----------
  function initRequirements() {
    const reqPicker = $("#reqPicker");
    const reqList = $("#reqList");
    const addReqBtn = $("#addReqBtn");
    if (!reqPicker || !reqList || !addReqBtn) return;

    const REQ = {
      propertyType: {
        label: "Тип недвижимости",
        tag: "🏠",
        build: () => ({ type: "propertyType", value: { kind: "Квартира", market: "Вторичка" } }),
        render: (s) => `
          <div class="field">
            <label>Тип</label>
            <select data-k="kind">
              ${["Квартира","Дом","Гостинка","Комната","Участок","Коммерция"]
                .map(v => `<option ${s.value.kind===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Рынок</label>
            <select data-k="market">
              ${["Вторичка","Новострой"]
                .map(v => `<option ${s.value.market===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
        `,
        summary: (s) => `${s.value.kind}, ${s.value.market}`,
      },

      district: {
        label: "Район",
        tag: "📍",
        build: () => ({ type: "district", value: { district: "Салтовка", metro: "Не важно" } }),
        render: (s) => `
          <div class="field">
            <label>Район</label>
            <select data-k="district">
              ${["Алексеевка","Аэропорт","Восточный","Гагарина (нач.)","Жуковского","Журавлевка","Залютiно","З-д Шевченко","Ивановка","Конный рынок","Красный луч","Лысая Гора","Москалевка","Н.Бавария","Немышля","Нов.Дома","Одесская","Основа","Павловка","Песочин","П.Поле","Пятихатки","Роганский","Салтовка","Сев.Салтовка","Сортировка","Хол.Гора","ХТЗ","Центр","Шишковка","ЮВ и ЦР"]
                .map(v => `<option ${s.value.district===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
          
        `,
        summary: (s) =>
          `${s.value.district}${s.value.metro && s.value.metro!=="Не важно" ? " / метро: " + s.value.metro : ""}`,
      },

      price: {
        label: "Цена",
        tag: "💰",
        build: () => ({ type: "price", value: { from: "", to: "" }, meta: { currency: "$" } }),
        render: (s) => `
          <div class="field">
            <label>От</label>
            <input data-k="from" inputmode="numeric" placeholder="например 25000" value="${s.value.from}" />
          </div>
          <div class="field">
            <label>До</label>
            <input data-k="to" inputmode="numeric" placeholder="например 35000" value="${s.value.to}" />
          </div>
        `,
        summary: (s) => {
          const f = s.value.from?.trim();
          const t = s.value.to?.trim();
          if (!f && !t) return "не указано";
          if (f && t) return `${f}–${t} ${s.meta.currency}`;
          if (f) return `от ${f} ${s.meta.currency}`;
          return `до ${t} ${s.meta.currency}`;
        },
      },

      rooms: {
        label: "Количество комнат",
        tag: "🛏",
        build: () => ({ type: "rooms", value: { from: "1", to: "2" } }),
        render: (s) => `
          <div class="field">
            <label>От</label>
            <select data-k="from">
              ${["Студия","1","2","3","4","5+"]
                .map(v => `<option ${s.value.from===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>До</label>
            <select data-k="to">
              ${["Студия","1","2","3","4","5+"]
                .map(v => `<option ${s.value.to===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
        `,
        summary: (s) => `${s.value.from}–${s.value.to}`,
      },

      floor: {
        label: "Этажность",
        tag: "🏢",
        build: () => ({ type: "floor", value: { from: "", to: "" } }),
        render: (s) => `
          <div class="field">
            <label>Этаж от</label>
            <input data-k="from" inputmode="numeric" placeholder="например 2" value="${s.value.from}" />
          </div>
          <div class="field">
            <label>Этаж до</label>
            <input data-k="to" inputmode="numeric" placeholder="например 8" value="${s.value.to}" />
          </div>
        `,
        summary: (s) => {
          const f = s.value.from?.trim();
          const t = s.value.to?.trim();
          if (!f && !t) return "не важно";
          if (f && t) return `${f}–${t}`;
          if (f) return `от ${f}`;
          return `до ${t}`;
        },
      },

      walls: {
        label: "Материал стен",
        tag: "🧱",
        build: () => ({ type: "walls", value: { mat: "Не важно" } }),
        render: (s) => `
          <div class="field">
            <label>Материал</label>
            <select data-k="mat">
              ${["Не важно","Панель","Кирпич","Монолит","Газоблок","Дерево","Сталинка/кирпич"]
                .map(v => `<option ${s.value.mat===v?"selected":""}>${v}</option>`).join("")}
            </select>
          </div>
        `,
        summary: (s) => s.value.mat,
      },

      area: {
        label: "Площадь",
        tag: "📐",
        build: () => ({ type: "area", value: { from: "", to: "" }, meta: { unit: "м²" } }),
        render: (s) => `
          <div class="field">
            <label>От (м²)</label>
            <input data-k="from" inputmode="numeric" placeholder="например 35" value="${s.value.from}" />
          </div>
          <div class="field">
            <label>До (м²)</label>
            <input data-k="to" inputmode="numeric" placeholder="например 60" value="${s.value.to}" />
          </div>
        `,
        summary: (s) => {
          const f = s.value.from?.trim();
          const t = s.value.to?.trim();
          if (!f && !t) return "не указано";
          if (f && t) return `${f}–${t} ${s.meta.unit}`;
          if (f) return `от ${f} ${s.meta.unit}`;
          return `до ${t} ${s.meta.unit}`;
        },
      },
    };

    const reqState = [];

    function refreshReqPicker() {
      const existing = new Set(reqState.map((x) => x.type));
      const options = Object.entries(REQ)
        .filter(([key]) => !existing.has(key))
        .map(([key, cfg]) => ({ key, label: cfg.label }));

      reqPicker.innerHTML =
        `<option value="" selected disabled>+ Добавить параметр…</option>` +
        options.map((o) => `<option value="${o.key}">${o.label}</option>`).join("");

      addReqBtn.disabled = options.length === 0;
    }

    function createReqElement(state) {
      const cfg = REQ[state.type];
      const wrap = document.createElement("div");
      wrap.className = "req-item";
      wrap.dataset.type = state.type;

      wrap.innerHTML = `
        <div class="req-head">
          <div class="req-name">
            <span class="tag">${cfg.tag}</span>
            <span>${cfg.label}</span>
          </div>
          <button class="iconbtn danger" type="button" title="Удалить параметр" aria-label="Удалить">✕</button>
        </div>

        <div class="req-body">${cfg.render(state)}</div>

      
      `;

      // удалить карточку => изменение
      wrap.querySelector("button")?.addEventListener("click", () => {
        const idx = reqState.findIndex((x) => x.type === state.type);
        if (idx >= 0) reqState.splice(idx, 1);
        wrap.remove();
        refreshReqPicker();
        setDirty();
      });

      // обновления полей => изменение
      wrap.addEventListener("change", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "SELECT" || el.tagName === "INPUT") {
          state.value[k] = el.value;
          
          setDirty();
        }
      });

      wrap.addEventListener("input", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;
        const k = el.getAttribute("data-k");
        if (!k) return;

        if (el.tagName === "INPUT") {
          state.value[k] = el.value;
        
          setDirty();
        }
      });

      return wrap;
    }

    // чтобы стартовые параметры НЕ считались “изменением”
    let boot = true;

    function addRequirement(typeKey) {
      if (!typeKey || !REQ[typeKey]) return;
      if (reqState.some((x) => x.type === typeKey)) return;

      const state = REQ[typeKey].build();
      reqState.push(state);
      reqList.appendChild(createReqElement(state));
      refreshReqPicker();

      if (!boot) setDirty();
    }

    addReqBtn.addEventListener("click", () => addRequirement(reqPicker.value));
    reqPicker.addEventListener("change", () => addRequirement(reqPicker.value));

    // стартовые параметры
    addRequirement("propertyType");
    addRequirement("district");
    addRequirement("price");
    boot = false;

    refreshReqPicker();

    // expose for collectData
    window.__REQ_STATE__ = reqState;
    window.__REQ__ = REQ;
  }

  // ---------- collectData ----------
  function collectData() {
    const phones = $$("#phones input").map((i) => i.value.trim()).filter(Boolean);
    const REQ = window.__REQ__ || {};
    const reqState = window.__REQ_STATE__ || [];

    return {
      clientId: $("#clientId")?.textContent?.trim() || "",
      fio: $("#fio")?.value?.trim() || "",
      birthday: $("#bday")?.value || null,
      lead: $("#lead")?.value || "",
      createdBy: $("#createdBy")?.value || "",
      active: ($("#active")?.value || "yes") === "yes",
      contacts: { email: $("#email")?.value?.trim() || "", phones },
      request: {
        dealType: $("#dealType")?.value || "buy",
        note: $("#reqNote")?.value?.trim() || "",
        requirements: reqState.map((s) => ({
          type: s.type,
          label: REQ[s.type]?.label || s.type,
          value: s.value,
          summary: REQ[s.type]?.summary ? REQ[s.type].summary(s) : "",
        })),
      },
      status: {
        status: $("#status")?.value || "",
        source: $("#source")?.value || "",
      },
      notes: $("#notes")?.value?.trim() || "",
      ts: new Date().toISOString(),
    };
  }

  // ---------- Dirty tracking (для обычных полей формы) ----------
  function initDirtyTracking() {
    const handler = (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      // изменения в тосте/дроувере не считаем "правками формы"
      if (t.closest("#toast")) return;
      if (t.closest("#pickDrawer")) return;

      // клик по кнопкам не должен делать dirty
      if (t.closest(".actions")) return;

      if (t.matches("input, textarea, select")) {
        setDirty();
      }
    };

    document.addEventListener("input", handler, true);
    document.addEventListener("change", handler, true);
  }

  // ===================== Drawer: подбор вариантов (ДЕМО) =====================
  const PICK = {
    open: false,
    tab: "objects",
  };

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatNum(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function getDemoMatches() {
  return {
    objects: [
      { id: "1304457", price: 9500, ppsm: 432, title: "1-комнатная квартира, подселение, Нов.Дома", meta: "Андрея Олесякова ул., 8 • м. Армейская" },
      { id: "1304270", price: 12000, ppsm: 600, title: "1-комнатная квартира, подселение, Нов.Дома", meta: "Байрона просп. • Коммун.рынок" },
      { id: "1303333", price: 18000, ppsm: 514, title: "1-комнатная квартира, Основа", meta: "Силикатная ул., 22В • озеро" },
      { id: "1302750", price: 19000, ppsm: 213, title: "5-комнатная квартира, Основа", meta: "Павла Тычины (Валдайская) ул." },
      { id: "1302749", price: 62000, ppsm: 939, title: "3-комнатная квартира, ХТЗ", meta: "Героев Харькова (Московский) проспект" },
      { id: "1302748", price: 25000, ppsm: 543, title: "2-комнатная квартира, Салтовка", meta: "Гвардейцев Широнинцев ул., 406 • 607" },
      { id: "1304457", price: 9500, ppsm: 432, title: "1-комнатная квартира, подселение, Нов.Дома", meta: "Андрея Олесякова ул., 8 • м. Армейская" },
      { id: "1304270", price: 12000, ppsm: 600, title: "1-комнатная квартира, подселение, Нов.Дома", meta: "Байрона просп. • Коммун.рынок" },
      { id: "1303333", price: 18000, ppsm: 514, title: "1-комнатная квартира, Основа", meta: "Силикатная ул., 22В • озеро" },
      { id: "1302750", price: 19000, ppsm: 213, title: "5-комнатная квартира, Основа", meta: "Павла Тычины (Валдайская) ул." },
      { id: "1302749", price: 62000, ppsm: 939, title: "3-комнатная квартира, ХТЗ", meta: "Героев Харькова (Московский) проспект" },
      { id: "1302748", price: 25000, ppsm: 543, title: "2-комнатная квартира, Салтовка", meta: "Гвардейцев Широнинцев ул., 406 • 607" },
      { id: "1304457", price: 9500, ppsm: 432, title: "1-комнатная квартира, подселение, Нов.Дома", meta: "Андрея Олесякова ул., 8 • м. Армейская" },
      { id: "1304270", price: 12000, ppsm: 600, title: "1-комнатная квартира, подселение, Нов.Дома", meta: "Байрона просп. • Коммун.рынок" },
      { id: "1303333", price: 18000, ppsm: 514, title: "1-комнатная квартира, Основа", meta: "Силикатная ул., 22В • озеро" },
      { id: "1302750", price: 19000, ppsm: 213, title: "5-комнатная квартира, Основа", meta: "Павла Тычины (Валдайская) ул." },
      { id: "1302749", price: 62000, ppsm: 939, title: "3-комнатная квартира, ХТЗ", meta: "Героев Харькова (Московский) проспект" },
      { id: "1302748", price: 25000, ppsm: 543, title: "2-комнатная квартира, Салтовка", meta: "Гвардейцев Широнинцев ул., 406 • 607" },
    ]
  };
}

  function renderPickListObjects(items) {
    const root = $("#pickListObjects");
    if (!root) return;

    root.innerHTML = items.map((x) => `
      <div class="pick-item">
        <div class="pick-thumb"></div>

        <div class="pick-main">
          <div class="pick-top">
            <div class="pick-price">$${formatNum(x.price)}</div>
            <div class="pick-ppsm">$${formatNum(x.ppsm)}/м²</div>
            <div class="pick-id">${escapeHtml(x.id)}</div>
          </div>
          <div class="pick-title">${escapeHtml(x.title)}</div>
          <div class="pick-meta">${escapeHtml(x.meta)}</div>
        </div>

        <button class="pick-open" type="button" title="Открыть">›</button>
      </div>
    `).join("");
  }

  function renderPickListPeople(items) {
    const root = $("#pickListPeople");
    if (!root) return;

    root.innerHTML = items.map((x) => `
      <div class="pick-item">
        <div class="pick-thumb"></div>

        <div class="pick-main">
          <div class="pick-top">
            <div class="pick-price">${escapeHtml(x.name)}</div>
            <div class="pick-id">${escapeHtml(x.role)}</div>
          </div>
          <div class="pick-title">${escapeHtml(x.phone)}</div>
          <div class="pick-meta">${escapeHtml(x.note)}</div>
        </div>

        <button class="pick-open" type="button" title="Открыть">›</button>
      </div>
    `).join("");
  }

  function setPickTab(tab) {
    PICK.tab = tab;

    $$("#pickTabs .drawer__tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === tab);
    });

    const objects = $("#pickListObjects");
    const people = $("#pickListPeople");
    if (!objects || !people) return;

    objects.hidden = tab !== "objects";
    people.hidden = tab !== "people";
  }

  function openPickDrawer(payload) {
  const backdrop = $("#pickBackdrop");
  const drawer = $("#pickDrawer");
  if (!backdrop || !drawer) return;

  const demo = getDemoMatches();

  renderPickListObjects(demo.objects);

  // если есть подзаголовок — можешь оставить или убрать
  const sub = $("#pickSubtitle");
  if (sub) {
    const deal = payload?.request?.dealType === "rent" ? "Сниму" : "Куплю";
    const note = payload?.request?.note ? ` • ${payload.request.note}` : "";
    sub.textContent = `${deal}${note}`;
  }

  backdrop.hidden = false;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  PICK.open = true;

  document.body.style.overflow = "hidden";
}


  function closePickDrawer() {
    const backdrop = $("#pickBackdrop");
    const drawer = $("#pickDrawer");
    if (!backdrop || !drawer) return;

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    PICK.open = false;

    document.body.style.overflow = "";
  }

  function initPickDrawerUI() {
    $("#pickBackdrop")?.addEventListener("click", closePickDrawer);
    $("#pickClose")?.addEventListener("click", closePickDrawer);

    $("#pickTabs")?.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".drawer__tab");
      if (!btn) return;
      setPickTab(btn.dataset.tab);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && PICK.open) closePickDrawer();
    });
  }
  // ==========================================================================

  // ---------- Actions ----------
  function initActions() {
    const saveBtn = $("#saveBtn");
    const savePickBtn = $("#savePickBtn");
    if (!saveBtn || !savePickBtn) return;

    // старт: обычные подписи
    updateActionButtons();

    saveBtn.addEventListener("click", () => {
      if (isSavedClean()) {
        // DELETE mode
        setDeleted();
        return;
      }

      setSaved();
    });

    savePickBtn.addEventListener("click", () => {
      if (isSavedClean()) {
        // PICK ONLY mode (без сохранения)
        const data = collectData();
        showToast({
          action: "pick_only",
          request: data.request,
          demo: "Открываем панель подбора (демо)",
        });
        openPickDrawer({ request: data.request });
        return;
      }

      // SAVE + PICK mode
      const data = collectData();
      showToast({
        action: "save_and_pick",
        data,
        demo: "Открываем панель подбора (демо)",
      });
      setSaved();
      openPickDrawer(data);
    });
  }

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    initActiveToggle();
    initPhones();
    initRequirements();
    initToast();
    initPickDrawerUI();      
    initDirtyTracking();
    initActions();
  });
})();
