(function () {
  const APP_CONFIG = window.APP_CONFIG || {};
  const USERS = window.DEMO_USERS || {};
  const session = JSON.parse(localStorage.getItem('payroll_demo_session') || 'null');
  const DEMO_STATE_KEY = 'payroll_demo_state_v2';

  const DEFAULT_STATE = {
    month: '2026/03',
    employeeCount: 42,
    timesheet: {
      totalDepartments: 6,
      approvedDepartments: [],
      pendingEmployees: 8,
      approvedEmployees: 0,
      departments: [
        'Санхүү',
        'Маркетинг',
        'IT',
        'Борлуулалт',
        'Нягтлан бодох бүртгэл',
        'Хүний нөөц'
      ]
    },
    payroll: {
      calculated: false,
      submittedToSenior: false,
      totalNet: 229960000,
      totalTax: 57490000,
      calculatedEmployees: 0,
      generatedAt: ''
    },
    bankFiles: [],
    senior: {
      pendingDepartments: ['Мэдээлэл Технологи', 'Хүний нөөц', 'Санхүү бүртгэл', 'Борлуулалт, Маркетинг', 'Захиргаа, Аж ахуй', 'Үйл ажиллагаа'],
      approvedDepartments: [],
      rejectedDepartments: []
    },
    executive: {
      approvedDepartments: [],
      finalApproved: false,
      finalApprovedAt: ''
    },
    taxConfig: {
      code: 'TAX-2026-001',
      createdBy: 'Б.Наран',
      createdAt: '2024-12-15',
      lastUpdatedAt: '2026-04-13 22:30',
      lastValue: '10%'
    },
    notifications: [],
    employeeDirectoryExtra: [],
    lastReport: null
  };

  function redirectToLogin() {
    window.location.href = 'index.html';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  }

  function ensureAccess() {
    if (!session || !session.page || session.page !== APP_CONFIG.fileName) {
      redirectToLogin();
      return false;
    }
    return true;
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function buttonText(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function cloneState(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DEMO_STATE_KEY) || 'null');
      if (!parsed) return cloneState(DEFAULT_STATE);
      return {
        ...cloneState(DEFAULT_STATE),
        ...parsed,
        timesheet: { ...cloneState(DEFAULT_STATE.timesheet), ...(parsed.timesheet || {}) },
        payroll: { ...cloneState(DEFAULT_STATE.payroll), ...(parsed.payroll || {}) },
        senior: { ...cloneState(DEFAULT_STATE.senior), ...(parsed.senior || {}) },
        executive: { ...cloneState(DEFAULT_STATE.executive), ...(parsed.executive || {}) },
        taxConfig: { ...cloneState(DEFAULT_STATE.taxConfig), ...(parsed.taxConfig || {}) },
        bankFiles: Array.isArray(parsed.bankFiles) ? parsed.bankFiles : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        employeeDirectoryExtra: Array.isArray(parsed.employeeDirectoryExtra) ? parsed.employeeDirectoryExtra : []
      };
    } catch (error) {
      return cloneState(DEFAULT_STATE);
    }
  }

  let demoState = loadState();

  function saveState() {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(demoState));
  }

  function addNotification(message) {
    demoState.notifications.unshift({
      message,
      at: new Date().toLocaleString('sv-SE').replace(' ', ' ')
    });
    demoState.notifications = demoState.notifications.slice(0, 8);
    saveState();
  }

  function injectBaseStyles() {
    if (document.getElementById('shared-demo-style')) return;
    const style = document.createElement('style');
    style.id = 'shared-demo-style';
    style.textContent = `
      .demo-user-badge{white-space:nowrap;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;padding:8px 12px;font-size:12px;font-weight:700;border-radius:10px}
      .demo-toast{position:fixed;right:20px;bottom:20px;background:#0f172a;color:#fff;padding:12px 14px;border-radius:12px;box-shadow:0 14px 32px rgba(15,23,42,.22);font-size:13px;font-weight:600;z-index:9999;opacity:0;transform:translateY(10px);transition:.25s ease;max-width:320px;line-height:1.5}
      .demo-toast.is-visible{opacity:1;transform:translateY(0)}
      .demo-note{margin-top:12px;padding:12px 14px;border-radius:12px;border:1px solid #dbeafe;background:#eff6ff;color:#1d4ed8;font-size:13px;font-weight:600;line-height:1.5}
      .demo-clickable{cursor:pointer}
      .demo-list{display:flex;flex-direction:column;gap:10px}
      .demo-list-item{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;border:1px solid #e2e8f0;background:#fff}
      .demo-subtle{font-size:12px;color:#64748b;font-weight:600}
      .demo-active-filter{background:#0f172a!important;color:#fff!important;border-color:#0f172a!important}
      .demo-file-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
      .demo-file-row:last-child{border-bottom:none}
      .demo-link-btn{border:none;background:#eff6ff;color:#2563eb;font-weight:700;border-radius:10px;padding:8px 12px;cursor:pointer}
      .demo-badge-success{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;font-size:12px;font-weight:700}
      .demo-badge-warn{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:#fef3c7;color:#b45309;border:1px solid #fde68a;font-size:12px;font-weight:700}
    `;
    document.head.appendChild(style);
  }

  function showToast(message) {
    injectBaseStyles();
    let toast = document.querySelector('.demo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'demo-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function showPage(id) {
    if (!id) return;
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    pages.forEach((page) => page.classList.toggle('active', page.id === id));
    navLinks.forEach((btn) => btn.classList.toggle('active', btn.dataset.page === id));
    sessionStorage.setItem(APP_CONFIG.fileName + ':page', id);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  function bindNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const triggers = document.querySelectorAll('[data-page-target]');
    navLinks.forEach((btn) => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    triggers.forEach((btn) => btn.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(btn.dataset.pageTarget);
    }));
    const initialPage = window.location.hash.replace('#', '') || sessionStorage.getItem(APP_CONFIG.fileName + ':page') || APP_CONFIG.defaultPage;
    showPage(initialPage);
  }

  function bindLogout() {
    document.querySelectorAll('.logout').forEach((link) => {
      link.setAttribute('href', 'index.html');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('payroll_demo_session');
        sessionStorage.removeItem(APP_CONFIG.fileName + ':page');
        redirectToLogin();
      });
    });
  }

  function addHeaderBadge() {
    const header = document.querySelector('.page-header');
    if (!header) return;
    const badgeWrap = document.createElement('div');
    badgeWrap.innerHTML = `<div class="demo-user-badge">${escapeHtml(session.fullName)} · ${escapeHtml(session.role)}</div>`;
    header.appendChild(badgeWrap.firstElementChild);
  }

  function injectSessionMeta() {
    setText('[data-session-name]', session?.fullName || '');
    setText('[data-session-role]', session?.role || '');
  }

  function setButtonEnabled(button, enabled, enabledClass, disabledClass) {
    if (!button) return;
    button.disabled = !enabled;
    button.style.pointerEvents = enabled ? 'auto' : 'none';
    button.style.opacity = enabled ? '1' : '0.72';
    if (enabledClass) button.classList.toggle(enabledClass, enabled);
    if (disabledClass) button.classList.toggle(disabledClass, !enabled);
  }

  function downloadTextFile(filename, content, type) {
    const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('en-US') + '₮';
  }

  function todayStamp() {
    return new Date().toLocaleString('sv-SE').replace(' ', ' ');
  }

  function getHrDepartmentNamesFromDom() {
    const names = qsa('#timesheet .dept-card .dept-name, #timesheet .dept-card h3').map((el) => el.textContent.trim()).filter(Boolean);
    return names.length ? names : cloneState(DEFAULT_STATE.timesheet.departments);
  }

  function normalizeTimesheetState() {
    const domDepartments = getHrDepartmentNamesFromDom();
    demoState.timesheet.departments = cloneState(domDepartments);
    demoState.timesheet.totalDepartments = domDepartments.length;
    demoState.timesheet.approvedDepartments = Array.from(new Set((demoState.timesheet.approvedDepartments || []).filter((name) => domDepartments.includes(name))));
    const ratio = demoState.timesheet.totalDepartments ? (demoState.timesheet.approvedDepartments.length / demoState.timesheet.totalDepartments) : 0;
    demoState.timesheet.pendingEmployees = Math.max(0, Math.round((1 - ratio) * 8));
    demoState.timesheet.approvedEmployees = Math.max(0, demoState.employeeCount - demoState.timesheet.pendingEmployees);
  }

  function hrProgressPercent() {
    normalizeTimesheetState();
    return demoState.timesheet.totalDepartments ? Math.round((demoState.timesheet.approvedDepartments.length / demoState.timesheet.totalDepartments) * 100) : 0;
  }

  function getTimesheetDone() {
    normalizeTimesheetState();
    return demoState.timesheet.totalDepartments > 0 && demoState.timesheet.approvedDepartments.length >= demoState.timesheet.totalDepartments;
  }

  function getSeniorDepartmentNamesFromDom() {
    const names = qsa('#manager-payroll .approval-item .approval-name').map((el) => el.textContent.trim()).filter(Boolean);
    return names.length ? names : cloneState(DEFAULT_STATE.senior.pendingDepartments);
  }

  function getAdminDepartmentNamesFromDom() {
    const names = qsa('#final-approval .approval-item .approval-name').map((el) => el.textContent.trim()).filter(Boolean);
    return names.length ? names : cloneState(DEFAULT_STATE.senior.pendingDepartments);
  }

  function syncTaxWidgets() {
    const codeEls = qsa('[data-tax-code]');
    const valueEls = qsa('[data-tax-value]');
    const updatedEls = qsa('[data-tax-updated]');
    codeEls.forEach((el) => el.textContent = demoState.taxConfig.code);
    valueEls.forEach((el) => el.textContent = demoState.taxConfig.lastValue);
    updatedEls.forEach((el) => el.textContent = demoState.taxConfig.lastUpdatedAt);

    const badge = qsa('#tax-config span').find((el) => el.textContent.includes('TAX-'));
    if (badge) badge.textContent = demoState.taxConfig.code;
    const cards = qsa('#tax-config .reports-grid .card');
    if (cards[2]) cards[2].querySelector('div:last-child').textContent = demoState.taxConfig.lastValue;
    const updatedCard = qsa('#tax-config .reports-grid .card')[1];
    if (updatedCard) updatedCard.querySelector('div:last-child').textContent = demoState.taxConfig.lastUpdatedAt;
  }

  function renderGlobalTaxNote() {
    const header = document.querySelector('.page-header');
    if (!header) return;
    let note = document.querySelector('.demo-global-tax-note');
    if (!note) {
      note = document.createElement('div');
      note.className = 'demo-note demo-global-tax-note';
      header.insertAdjacentElement('afterend', note);
    }
    note.innerHTML = `<strong>Идэвхтэй параметр:</strong> <span data-tax-code>${escapeHtml(demoState.taxConfig.code)}</span> · ХХОАТ <span data-tax-value>${escapeHtml(demoState.taxConfig.lastValue)}</span> · шинэчилсэн огноо <span data-tax-updated>${escapeHtml(demoState.taxConfig.lastUpdatedAt)}</span>`;
  }

  function clearAfterSeniorApproval() {
    demoState.senior.pendingDepartments = [];
    demoState.senior.rejectedDepartments = [];
    demoState.senior.allApprovedCleared = true;
    saveState();
  }

  function clearAfterExecutiveApproval() {
    demoState.executive.approvedDepartments = [];
    demoState.executive.finalApproved = true;
    demoState.executive.finalApprovedAt = todayStamp();
    demoState.executive.allApprovedCleared = true;
    demoState.payroll.calculated = false;
    demoState.payroll.submittedToSenior = false;
    demoState.bankFiles = [];
    demoState.timesheet.approvedDepartments = [];
    demoState.timesheet.pendingEmployees = 8;
    demoState.timesheet.approvedEmployees = 0;
    demoState.senior.pendingDepartments = [];
    demoState.senior.approvedDepartments = [];
    demoState.senior.rejectedDepartments = [];
    demoState.senior.allApprovedCleared = true;
    saveState();
  }

  function syncSeniorFromPayroll() {
    if (!demoState.payroll.submittedToSenior) return;
    const domDepartments = getSeniorDepartmentNamesFromDom();
    const known = Array.from(new Set([
      ...domDepartments,
      ...(demoState.senior.pendingDepartments || []),
      ...(demoState.senior.approvedDepartments || []),
      ...(demoState.senior.rejectedDepartments || [])
    ]));
    if (!demoState.senior.pendingDepartments.length && !demoState.senior.approvedDepartments.length && !demoState.senior.rejectedDepartments.length) {
      demoState.senior.pendingDepartments = cloneState(domDepartments);
    } else {
      demoState.senior.pendingDepartments = known.filter((dept) => !demoState.senior.approvedDepartments.includes(dept) && !demoState.senior.rejectedDepartments.includes(dept));
    }
    saveState();
  }

  function genericReportBinder() {
    qsa('.report-card').forEach((card) => {
      card.classList.add('demo-clickable');
      if (card.dataset.demoBound === 'true') return;
      card.dataset.demoBound = 'true';
      card.addEventListener('click', () => {
        const title = qs('h3', card)?.textContent?.trim() || 'Тайлан';
        demoState.lastReport = { title, at: todayStamp(), by: session?.fullName || 'system' };
        saveState();
        showToast(`“${title}” тайлан preview байдлаар нээгдлээ.`);
      });
    });
  }

  function initHrDemo() {
    if (APP_CONFIG.fileName !== 'hr.html') return;
    normalizeTimesheetState();
    saveState();
    const deptButtons = qsa('#timesheet .dept-card .btn-blue, #timesheet .dept-card .btn-disabled');
    const approveAllButton = qsa('#timesheet .page-header .btn-blue').find((el) => buttonText(el).includes('Бүгдийг баталгаажуулах'));
    const summary = qs('#timesheet .page-subtitle');
    const homeAlertStrong = qs('#home .alert strong');
    const homeAlertTextWrap = qs('#home .alert div');
    const homeStatCards = qsa('#home .stat-card');
    const checklistButton = qsa('#home .btn').find((el) => buttonText(el).includes('Нөхцөл'));
    const employeesSection = qs('#employees');
    const searchInput = qs('#employees input');
    const deptSelect = qs('#employees .select');
    const tbody = qs('#employees tbody');
    const addEmployeeButton = qsa('#employees .btn').find((el) => buttonText(el).includes('Шинэ ажилтан'));
    const importButton = qsa('#employees .btn').find((el) => buttonText(el).includes('Excel'));

    function renderEmployees() {
      if (!tbody) return;
      const allRows = qsa('tr', tbody);
      const query = (searchInput?.value || '').trim().toLowerCase();
      const selectedDept = deptSelect?.dataset.currentDept || 'Бүх алба';
      allRows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        const deptText = row.children[4]?.textContent?.trim() || '';
        const matchQuery = !query || text.includes(query);
        const matchDept = selectedDept === 'Бүх алба' || deptText === selectedDept;
        row.style.display = matchQuery && matchDept ? '' : 'none';
      });
    }

    function appendEmployee(name) {
      if (!tbody) return;
      const id = 'EMP' + String(100 + demoState.employeeDirectoryExtra.length + 1).slice(-3);
      const departments = ['Санхүү', 'Маркетинг', 'IT', 'Борлуулалт', 'Хүний нөөц'];
      const dept = departments[demoState.employeeDirectoryExtra.length % departments.length];
      const row = document.createElement('tr');
      row.innerHTML = `<td><strong>${id}</strong></td><td>${escapeHtml(name)}</td><td>********${Math.floor(1000 + Math.random() * 8999)} <span class="muted-eye">◉</span></td><td>88${Math.floor(1000000 + Math.random() * 8999999)}</td><td>${dept}</td><td>Ажилтан</td><td>******${Math.floor(1000 + Math.random() * 8999)} <span class="muted-eye">◉</span></td><td><span class="mini-pill mini-blue">Үндсэн</span></td><td><span class="mini-pill mini-green">Идэвхтэй</span></td><td><div class="actions"><span>✎</span><span class="danger">⌁</span></div></td>`;
      tbody.appendChild(row);
      demoState.employeeDirectoryExtra.push({ id, name, dept });
      demoState.employeeCount += 1;
      saveState();
      bindEmployeeRowActions();
      updateHrState();
      renderEmployees();
    }

    function bindEmployeeRowActions() {
      qsa('#employees tbody .actions span').forEach((icon) => {
        if (icon.dataset.demoBound === 'true') return;
        icon.dataset.demoBound = 'true';
        icon.addEventListener('click', () => {
          showToast(icon.classList.contains('danger') ? 'Ажилтны мөрийг demo горимоор идэвхгүй болголоо.' : 'Ажилтны мэдээлэл засварлах цонх demo горимоор нээгдлээ.');
        });
      });
    }

    function approveDepartment(button) {
      const card = button.closest('.dept-card');
      const name = (card?.querySelector('h3') || card?.querySelector('.dept-name'))?.textContent?.trim();
      if (!name || demoState.timesheet.approvedDepartments.includes(name)) return;
      demoState.timesheet.approvedDepartments.push(name);
      demoState.timesheet.pendingEmployees = Math.max(0, 8 - Math.ceil((demoState.timesheet.approvedDepartments.length / demoState.timesheet.totalDepartments) * 8));
      demoState.timesheet.approvedEmployees = demoState.employeeCount - demoState.timesheet.pendingEmployees;
      addNotification(`HR: ${name} хэлтсийн цагийн бүртгэл баталгаажлаа. Нягтлан шалгана уу.`);
      saveState();
      updateHrState();
      showToast(`${name} хэлтсийн цагийн бүртгэл баталгаажлаа.`);
    }

    function updateHrState() {
      normalizeTimesheetState();
      const approved = demoState.timesheet.approvedDepartments.length;
      if (summary) summary.textContent = `2026 оны 3-р сарын цагийн бүртгэл (${approved}/${demoState.timesheet.totalDepartments} алба баталгаажсан)`;

      deptButtons.forEach((button) => {
        const card = button.closest('.dept-card');
        const deptName = (card?.querySelector('h3') || card?.querySelector('.dept-name'))?.textContent?.trim();
        const done = demoState.timesheet.approvedDepartments.includes(deptName);
        button.textContent = done ? 'Баталгаажсан' : 'Баталгаажуулах';
        button.classList.toggle('btn-blue', !done);
        button.classList.toggle('btn-disabled', done);
        button.style.pointerEvents = done ? 'none' : 'auto';
        const warn = card?.querySelector('.warn');
        if (warn) warn.textContent = done ? 'Бүгд баталгаажсан' : '2 баталгаажаагүй';
      });

      if (homeAlertTextWrap) {
        const bodyMessage = approved === demoState.timesheet.totalDepartments
          ? 'Цалин бодолт эхлүүлэх нөхцөл хангагдлаа.'
          : 'Цалин бодолт эхлүүлэхийн тулд эхлээд цагийн бүртгэлийг баталгаажуулна уу.';
        homeAlertTextWrap.innerHTML = `<strong>${approved === demoState.timesheet.totalDepartments ? 'Цагийн баталгаажуулалт бүрэн дууслаа' : 'Цагийн баталгаажуулалт дуусаагүй байна'}</strong> ${bodyMessage}<div style="margin-top:10px;"><button class="btn btn-blue-outline btn-sm" data-page-target="timesheet" style="border-color:#f59e0b; color:#d97706;">Цагийн бүртгэл рүү очих</button></div>`;
        const goBtn = homeAlertTextWrap.querySelector('[data-page-target]');
        if (goBtn) goBtn.addEventListener('click', (e) => { e.preventDefault(); showPage('timesheet'); });
      }

      if (homeStatCards.length >= 4) {
        homeStatCards[0].querySelector('.big').textContent = approved === demoState.timesheet.totalDepartments ? 'Бэлэн' : 'Хүлээгдэж буй';
        homeStatCards[0].querySelector('.pill').textContent = approved === demoState.timesheet.totalDepartments ? 'Бэлэн' : 'Хүлээгдэж буй';
        homeStatCards[1].querySelector('.big').textContent = String(demoState.timesheet.pendingEmployees);
        homeStatCards[2].querySelector('.big').textContent = approved === demoState.timesheet.totalDepartments ? 'Бүх хэлтэс' : `${demoState.timesheet.pendingEmployees} ажилтан`;
        homeStatCards[2].querySelector('small').textContent = approved === demoState.timesheet.totalDepartments ? 'Баталгаажсан' : 'Хүлээгдэж буй';
        homeStatCards[3].querySelector('.big').textContent = String(demoState.employeeCount);
      }

      if (checklistButton) {
        checklistButton.textContent = approved === demoState.timesheet.totalDepartments ? 'Нөхцөл хангагдсан' : 'Нөхцөл хангагдаагүй байна';
        checklistButton.classList.toggle('btn-blue', approved === demoState.timesheet.totalDepartments);
        checklistButton.classList.toggle('btn-disabled', approved !== demoState.timesheet.totalDepartments);
      }

      const employeeTitle = qsa('#employees .page-subtitle')[0];
      if (employeeTitle) employeeTitle.textContent = `Нийт ${demoState.employeeCount} идэвхтэй ажилтан`;
    }

    deptButtons.forEach((button) => {
      if (button.dataset.demoBound === 'true') return;
      button.dataset.demoBound = 'true';
      button.addEventListener('click', () => approveDepartment(button));
    });

    if (approveAllButton) {
      approveAllButton.addEventListener('click', () => {
        deptButtons.forEach((btn) => approveDepartment(btn));
      });
    }

    if (searchInput) searchInput.addEventListener('input', renderEmployees);
    if (deptSelect) {
      deptSelect.dataset.currentDept = 'Бүх алба';
      deptSelect.addEventListener('click', () => {
        const options = ['Бүх алба', 'Санхүү', 'Маркетинг', 'IT', 'Борлуулалт', 'Хүний нөөц'];
        const current = deptSelect.dataset.currentDept || options[0];
        const next = options[(options.indexOf(current) + 1) % options.length];
        deptSelect.dataset.currentDept = next;
        deptSelect.innerHTML = `${escapeHtml(next)} <span>⌄</span>`;
        renderEmployees();
      });
    }

    if (importButton) {
      importButton.addEventListener('click', () => {
        addNotification('HR: Excel импортыг demo горимоор ажиллууллаа.');
        showToast('Excel импорт demo горимоор амжилттай дууслаа.');
      });
    }

    bindEmployeeRowActions();
    updateHrState();
    renderEmployees();
  }

  function initAccDemo() {
    if (APP_CONFIG.fileName !== 'acc.html') return;
    normalizeTimesheetState();
    renderGlobalTaxNote();
    syncTaxWidgets();
    const homeStats = qsa('#home .stat-card');
    const notificationPanel = qs('#home .empty-state');
    const quickCalc = qsa('#home .action-btn').find((el) => buttonText(el).includes('Цалин бодолт эхлүүлэх'));
    const quickBank = qsa('#home .action-btn').find((el) => buttonText(el).includes('Банкны файл'));
    const warningNote = qs('#home .warning-note');
    const progressItems = qsa('#home .progress-item');
    const payrollAlert = qs('#payroll .alert');
    const payrollButton = qsa('#payroll .btn').find((el) => buttonText(el).includes('Цалин бодолт эхлүүлэх'));
    const bankAlert = qs('#bank-files .alert');
    const bankButton = qsa('#bank-files .btn').find((el) => buttonText(el).includes('Банкны файл үүсгэх'));
    const filesPanel = qsa('#bank-files .panel')[0];

    function updateAccState() {
      const timesheetDone = getTimesheetDone();
      if (homeStats.length >= 4) {
        homeStats[0].querySelector('.big').textContent = String(demoState.payroll.calculated ? demoState.employeeCount : 0);
        homeStats[1].querySelector('.big').textContent = String(demoState.payroll.calculated ? 0 : demoState.employeeCount);
        homeStats[2].querySelector('.big').textContent = timesheetDone ? 'Дууссан' : 'Хүлээгдэж буй';
        homeStats[2].querySelector('small').textContent = timesheetDone ? 'HR баталгаажуулалт дууссан' : 'HR баталгаажуулах шаардлагатай';
        homeStats[3].querySelector('.big').textContent = String(demoState.employeeCount);
      }
      if (notificationPanel) {
        if (demoState.notifications.length) {
          notificationPanel.innerHTML = `<div class="demo-list">${demoState.notifications.slice(0, 5).map((item) => `<div class="demo-list-item"><div>${escapeHtml(item.message)}<div class="demo-subtle">${escapeHtml(item.at)}</div></div><span class="demo-badge-success">new</span></div>`).join('')}</div>`;
        } else {
          notificationPanel.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><div>Мэдэгдэл байхгүй байна</div>';
        }
      }
      setButtonEnabled(quickCalc, timesheetDone && !demoState.payroll.calculated, 'action-btn', 'disabled');
      if (quickCalc && demoState.payroll.calculated) quickCalc.textContent = 'Цалин бодолт дууссан';
      if (warningNote) warningNote.textContent = timesheetDone ? (demoState.payroll.calculated ? 'Цалин бодолт амжилттай дууссан. Ахлах нягтланд илгээсэн.' : 'HR баталгаажуулалт хийгдсэн. Цалин бодолт эхлүүлэхэд бэлэн.') : 'HR-ээс бүх цагийн баталгаажуулалт дууссаны дараа цалин бодолт идэвхжинэ';
      if (progressItems.length >= 4) {
        progressItems[1].querySelector('.row span:last-child').textContent = timesheetDone ? '100%' : '0%';
        progressItems[1].querySelector('.fill').style.width = timesheetDone ? '100%' : '0%';
        progressItems[2].querySelector('.row span:last-child').textContent = demoState.payroll.calculated ? '100%' : '0%';
        progressItems[2].querySelector('.fill').style.width = demoState.payroll.calculated ? '100%' : '0%';
        progressItems[2].querySelector('.fill').style.background = demoState.payroll.calculated ? '#16a34a' : '#cbd5e1';
        progressItems[3].querySelector('.row span:last-child').textContent = demoState.bankFiles.length ? '100%' : '0%';
        progressItems[3].querySelector('.fill').style.width = demoState.bankFiles.length ? '100%' : '0%';
        progressItems[3].querySelector('.fill').style.background = demoState.bankFiles.length ? '#16a34a' : '#cbd5e1';
      }
      if (payrollAlert) {
        payrollAlert.classList.toggle('red', !timesheetDone);
        payrollAlert.classList.toggle('yellow', timesheetDone && !demoState.payroll.calculated);
        const lines = qsa('div', payrollAlert);
        if (lines.length >= 2) {
          lines[0].textContent = timesheetDone ? (demoState.payroll.calculated ? 'Цалин бодолт дууссан байна' : 'Цалин бодолт эхлүүлэхэд бэлэн байна') : 'Цагийн баталгаажуулалт дуусаагүй байна';
          lines[1].textContent = timesheetDone ? (demoState.payroll.calculated ? `Нийт ${demoState.employeeCount} ажилтны бодолт хийгдэж, ахлах нягтланд илгээгдлээ.` : 'HR-ээс бүх хэлтсийн цагийн бүртгэл баталгаажсан тул үргэлжлүүлж болно.') : 'Бүх хэлтсийн цагийн баталгаажуулалт дуусаагүй байна.';
        }
      }
      setButtonEnabled(payrollButton, timesheetDone && !demoState.payroll.calculated, 'btn-primary', 'disabled');
      if (payrollButton && demoState.payroll.calculated) payrollButton.textContent = 'Цалин бодолт дууссан';
      if (bankAlert) {
        const lines = qsa('div', bankAlert);
        if (lines.length >= 2) {
          lines[0].textContent = demoState.payroll.calculated ? 'Банкны файл үүсгэхэд бэлэн байна' : 'Цалин бодолт баталгаажаагүй байна';
          lines[1].textContent = demoState.payroll.calculated ? 'CSV/XML хэлбэрээр банкны файл үүсгээд шууд татаж авч болно.' : 'Эхлээд цалин бодолт хийгдэж ахлах нягтланд илгээгдсэн байх шаардлагатай.';
        }
      }
      setButtonEnabled(bankButton, demoState.payroll.calculated, '', 'btn-disabled');
      if (filesPanel) {
        const title = qs('h3', filesPanel);
        if (title) title.textContent = `Үүсгэсэн файлууд (${demoState.bankFiles.length})`;
        const oldList = qs('.demo-list', filesPanel);
        const emptyState = qs('.file-empty', filesPanel);
        if (demoState.bankFiles.length) {
          if (emptyState) emptyState.remove();
          let wrap = oldList;
          if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'demo-list';
            filesPanel.appendChild(wrap);
          }
          wrap.innerHTML = demoState.bankFiles.map((file, index) => `<div class="demo-file-row"><div><strong>${escapeHtml(file.name)}</strong><div class="demo-subtle">${escapeHtml(file.createdAt)} · ${escapeHtml(file.format)}</div></div><button class="demo-link-btn" data-file-index="${index}">Татах</button></div>`).join('');
          qsa('[data-file-index]', wrap).forEach((btn) => {
            btn.addEventListener('click', () => {
              const file = demoState.bankFiles[Number(btn.dataset.fileIndex)];
              downloadTextFile(file.name, file.content, 'text/csv;charset=utf-8');
              showToast(`${file.name} файл татагдлаа.`);
            });
          });
        } else if (oldList) {
          oldList.remove();
        }
      }
      syncTaxWidgets();
    }

    function calculatePayroll() {
      if (!getTimesheetDone()) {
        showToast('Эхлээд HR тал дээр бүх цагийн баталгаажуулалтыг дуусгана уу.');
        return;
      }
      demoState.payroll.calculated = true;
      demoState.payroll.submittedToSenior = true;
      demoState.payroll.generatedAt = todayStamp();
      demoState.payroll.calculatedEmployees = demoState.employeeCount;
      demoState.senior.allApprovedCleared = false;
      syncSeniorFromPayroll();
      addNotification('Нягтлан: 2026/03 сарын цалин бодолт дуусч ахлах нягтланд илгээгдлээ.');
      saveState();
      updateAccState();
      showToast('Цалин бодолт амжилттай дуусч, ахлах нягтланд илгээгдлээ.');
    }

    function createBankFile() {
      const formatLabel = 'CSV';
      const filename = `bank-transfer-${demoState.month.replace('/', '-')}-${demoState.bankFiles.length + 1}.csv`;
      const content = `employee_id,employee_name,net_salary\nEMP001,Батбаяр Болд,2450000\nEMP002,Дорж Энхбат,2380000\nEMP003,Түмэн Баар,2420000`; 
      demoState.bankFiles.unshift({ name: filename, format: formatLabel, createdAt: todayStamp(), content });
      addNotification(`Нягтлан: ${filename} банкны файл үүсгэлээ.`);
      saveState();
      updateAccState();
      showToast('Банкны файл амжилттай үүсэж жагсаалтад нэмэгдлээ.');
    }

    if (quickCalc) quickCalc.addEventListener('click', calculatePayroll);
    if (payrollButton) payrollButton.addEventListener('click', calculatePayroll);
    if (quickBank) quickBank.addEventListener('click', () => {
      showPage('bank-files');
      if (!demoState.payroll.calculated) showToast('Эхлээд цалин бодолтыг дуусгана уу.');
    });
    if (bankButton) bankButton.addEventListener('click', createBankFile);

    genericReportBinder();
    updateAccState();
  }

  function initSeniorDemo() {
    if (APP_CONFIG.fileName !== 'sacc.html') return;
    renderGlobalTaxNote();
    syncSeniorFromPayroll();
    syncTaxWidgets();
    const dashboardStats = qsa('#manager-dashboard .stat-card');
    const dashboardList = qsa('#manager-dashboard .approval-list, #manager-dashboard .table-list')[0] || qs('#manager-dashboard .card');
    const managerCards = qsa('#manager-payroll .approval-item');
    const approveAllButton = qsa('#manager-payroll .btn').find((el) => buttonText(el).includes('Бүх хэлтсийг батлах'));
    const auditPanel = qsa('#manager-dashboard .card').find((card) => card.textContent.includes('Audit Log'));
    const taxButton = qsa('#tax-config .btn').find((el) => buttonText(el).includes('Шинэ параметр'));
    const seniorDepartments = getSeniorDepartmentNamesFromDom();

    seniorDepartments.forEach((dept) => {
      if (!demoState.senior.approvedDepartments.includes(dept) && !demoState.senior.rejectedDepartments.includes(dept) && !demoState.senior.pendingDepartments.includes(dept) && demoState.payroll.submittedToSenior) {
        demoState.senior.pendingDepartments.push(dept);
      }
    });
    saveState();

    function rebuildAuditPanel() {
      if (!auditPanel) return;
      const items = [
        ...(demoState.notifications || []).slice(0, 5).map((item) => ({ time: item.at.split(' ')[1] || '12:00:00', type: 'UPDATE', actor: 'Систем', message: item.message }))
      ];
      const heading = '<h3 style="margin-bottom:18px;">Audit Log (Сүүлийн өөрчлөлтүүд)</h3>';
      auditPanel.innerHTML = `${heading}<div class="demo-list">${items.map((item) => `<div class="demo-list-item"><div><strong>${escapeHtml(item.time)}</strong> · ${escapeHtml(item.type)}<div class="demo-subtle">${escapeHtml(item.actor)}</div><div style="margin-top:4px;">${escapeHtml(item.message)}</div></div></div>`).join('') || '<div class="demo-list-item">Өөрчлөлтийн түүх алга байна.</div>'}</div>`;
    }

    function updateDashboard() {
      const pendingCount = demoState.senior.pendingDepartments.length;
      if (dashboardStats.length >= 3) {
        dashboardStats[0].querySelector('.big').textContent = `${pendingCount} хэлтэс`;
        dashboardStats[1].querySelector('.big').textContent = demoState.taxConfig.code;
        dashboardStats[2].querySelector('.big').textContent = pendingCount === 0 ? '0%' : '+2.4%';
      }
      if (dashboardList && demoState.payroll.submittedToSenior) {
        const wrap = dashboardList.closest('.card') || dashboardList;
        const listHost = wrap.querySelector('.demo-list') || document.createElement('div');
        listHost.className = 'demo-list';
        if (demoState.senior.allApprovedCleared) {
          listHost.innerHTML = '<div class="demo-list-item"><div><strong>Бүх хэлтэс батлагдсан</strong><div class="demo-subtle">Жагсаалт цэвэрлэгдсэн</div></div><span class="demo-badge-success">done</span></div>';
        } else {
          listHost.innerHTML = seniorDepartments.map((dept) => {
            const approved = demoState.senior.approvedDepartments.includes(dept);
            const rejected = demoState.senior.rejectedDepartments.includes(dept);
            return `<div class="demo-list-item"><div><strong>${escapeHtml(dept)}</strong><div class="demo-subtle">${approved ? 'Батлагдсан' : rejected ? 'Буцаасан' : 'Хянагдаж буй'}</div></div><span class="${approved ? 'demo-badge-success' : 'demo-badge-warn'}">${approved ? 'approved' : rejected ? 'returned' : 'pending'}</span></div>`;
          }).join('');
        }
        const title = wrap.querySelector('h3');
        if (title && title.textContent.includes('Хянах')) {
          qsa(':scope > :not(h3)', wrap).forEach((el) => el.remove());
          wrap.appendChild(listHost);
        }
      }
      syncTaxWidgets();
      rebuildAuditPanel();
    }

    function maybeFinalizeSeniorClear() {
      if (seniorDepartments.length && seniorDepartments.every((dept) => demoState.senior.approvedDepartments.includes(dept))) {
        clearAfterSeniorApproval();
        addNotification('Ахлах нягтлан: бүх хэлтсийг баталж жагсаалтыг цэвэрлэлээ.');
      }
    }

    function updateManagerPayroll() {
      managerCards.forEach((card) => {
        const dept = qs('.approval-name', card)?.textContent?.trim();
        const approved = demoState.senior.approvedDepartments.includes(dept);
        const rejected = demoState.senior.rejectedDepartments.includes(dept);
        const hidden = demoState.senior.allApprovedCleared;
        const meta = qs('.approval-meta', card);
        const buttons = qsa('button', card);
        const detailBtn = buttons.find((btn) => buttonText(btn).includes('Дэлгэрэнгүй'));
        const approveBtn = buttons.find((btn) => ['○','✓','Батлах','Батлагдсан'].includes(buttonText(btn)));
        const rejectBtn = buttons.find((btn) => ['▢','↺','Буцаах','Буцаасан'].includes(buttonText(btn)));
        card.style.display = hidden ? 'none' : '';
        if (meta) meta.textContent = approved ? 'Батлагдсан' : rejected ? 'Буцаасан' : 'Хянагдаж буй';
        if (approveBtn) {
          approveBtn.textContent = approved ? '✓' : '○';
          approveBtn.style.background = approved ? '#dcfce7' : '';
        }
        if (rejectBtn) {
          rejectBtn.textContent = rejected ? '↺' : '▢';
          rejectBtn.style.background = rejected ? '#fef3c7' : '';
        }
        if (detailBtn && !detailBtn.dataset.demoBound) {
          detailBtn.dataset.demoBound = 'true';
          detailBtn.addEventListener('click', () => showToast(`${dept} хэлтсийн дэлгэрэнгүй жагсаалт demo горимоор нээгдлээ.`));
        }
        if (approveBtn && !approveBtn.dataset.demoBound) {
          approveBtn.dataset.demoBound = 'true';
          approveBtn.addEventListener('click', () => {
            demoState.senior.allApprovedCleared = false;
            if (!demoState.senior.approvedDepartments.includes(dept)) demoState.senior.approvedDepartments.push(dept);
            demoState.senior.pendingDepartments = demoState.senior.pendingDepartments.filter((item) => item !== dept);
            demoState.senior.rejectedDepartments = demoState.senior.rejectedDepartments.filter((item) => item !== dept);
            addNotification(`Ахлах нягтлан: ${dept} хэлтсийн бодолтыг баталлаа.`);
            maybeFinalizeSeniorClear();
            saveState();
            updateManagerPayroll();
            updateDashboard();
            showToast(`${dept} хэлтсийн бодолтыг баталлаа.`);
          });
        }
        if (rejectBtn && !rejectBtn.dataset.demoBound) {
          rejectBtn.dataset.demoBound = 'true';
          rejectBtn.addEventListener('click', () => {
            demoState.senior.allApprovedCleared = false;
            demoState.senior.approvedDepartments = demoState.senior.approvedDepartments.filter((item) => item !== dept);
            if (!demoState.senior.rejectedDepartments.includes(dept)) demoState.senior.rejectedDepartments.push(dept);
            if (!demoState.senior.pendingDepartments.includes(dept)) demoState.senior.pendingDepartments.push(dept);
            addNotification(`Ахлах нягтлан: ${dept} хэлтсийн бодолтыг буцаалаа.`);
            saveState();
            updateManagerPayroll();
            updateDashboard();
            showToast(`${dept} хэлтсийн бодолтыг буцаалаа.`);
          });
        }
      });
      if (demoState.senior.allApprovedCleared) {
        const host = qs('#manager-payroll .card') || qs('#manager-payroll');
        if (host && !qs('.demo-note', host)) {
          const note = document.createElement('div');
          note.className = 'demo-note';
          note.textContent = 'Бүх хэлтэс батлагдсан тул бодолтын жагсаалт цэвэрлэгдлээ.';
          host.appendChild(note);
        }
      }
    }

    if (approveAllButton) {
      approveAllButton.addEventListener('click', () => {
        demoState.senior.approvedDepartments = Array.from(new Set([...demoState.senior.approvedDepartments, ...seniorDepartments]));
        maybeFinalizeSeniorClear();
        addNotification('Ахлах нягтлан: бүх хэлтсийн бодолтыг баталлаа.');
        saveState();
        updateManagerPayroll();
        updateDashboard();
        showToast('Бүх хэлтсийн бодолтыг баталлаа.');
      });
    }

    genericReportBinder();
    updateManagerPayroll();
    updateDashboard();
  }

  function initAdminDemo() {
    if (APP_CONFIG.fileName !== 'admin.html') return;
    renderGlobalTaxNote();
    syncTaxWidgets();
    const stats = qsa('#dashboard .stat-card');
    const detailButton = qsa('#dashboard .btn').find((el) => buttonText(el).includes('Дэлгэрэнгүй'));
    const reviewButton = qsa('#dashboard .btn').find((el) => buttonText(el).includes('Хянаад батлах'));
    const approvalItems = qsa('#final-approval .approval-item');
    const finalButton = qsa('#final-approval .btn').find((el) => buttonText(el).includes('ЦАЛИНГ БАТЛАХ'));
    const adminDepartments = getAdminDepartmentNamesFromDom();

    function seniorReady() {
      return demoState.senior.allApprovedCleared || adminDepartments.every((dept) => demoState.senior.approvedDepartments.includes(dept));
    }

    function updateAdminState() {
      if (stats.length >= 3) {
        stats[0].querySelector('p').textContent = demoState.executive.finalApproved ? 'Систем: Эцэслэн батлагдсан' : seniorReady() ? 'Систем: Баталгаажуулалтад бэлэн' : 'Систем: Ахлах нягтлангийн батлалт хүлээгдэж байна';
        stats[1].querySelector('h3').textContent = seniorReady() ? '1 бодолт' : '0 бодолт';
        stats[2].querySelector('h3').textContent = demoState.executive.finalApproved ? '0%' : '+3.2%';
      }
      approvalItems.forEach((card) => {
        const name = qs('.approval-name', card)?.textContent?.trim();
        const approved = demoState.executive.approvedDepartments.includes(name);
        const meta = qs('.approval-meta', card);
        const btns = qsa('button', card);
        const peopleBtn = btns.find((btn) => buttonText(btn).includes('Ажилчид'));
        const approveBtn = btns.find((btn) => buttonText(btn).includes('Батлах') || buttonText(btn).includes('Батлагдсан'));
        card.style.display = demoState.executive.allApprovedCleared ? 'none' : '';
        if (meta) meta.textContent = approved ? 'Батлагдсан' : 'Хүлээгдэж буй';
        if (approveBtn) {
          approveBtn.textContent = approved ? 'Батлагдсан' : 'Батлах';
          approveBtn.style.background = approved ? '#dcfce7' : '';
        }
        if (peopleBtn && !peopleBtn.dataset.demoBound) {
          peopleBtn.dataset.demoBound = 'true';
          peopleBtn.addEventListener('click', () => showToast(`${name} албаны ажилчдын жагсаалт demo горимоор нээгдлээ.`));
        }
        if (approveBtn && !approveBtn.dataset.demoBound) {
          approveBtn.dataset.demoBound = 'true';
          approveBtn.addEventListener('click', () => {
            if (!seniorReady()) {
              showToast('Эхлээд ахлах нягтлангийн баталгаажуулалт дуусах шаардлагатай.');
              return;
            }
            if (!demoState.executive.approvedDepartments.includes(name)) demoState.executive.approvedDepartments.push(name);
            addNotification(`Удирдлага: ${name} албаны эцсийн баталгааг хийлээ.`);
            saveState();
            updateAdminState();
            showToast(`${name} албаны эцсийн баталгаа хийгдлээ.`);
          });
        }
      });
      setButtonEnabled(finalButton, seniorReady(), 'btn-large', '');
      if (finalButton && demoState.executive.finalApproved) {
        finalButton.textContent = 'ЭЦЭСЛЭН БАТЛАГДСАН';
        finalButton.style.background = '#16a34a';
      }
      const host = qs('#final-approval .card') || qs('#final-approval');
      if (demoState.executive.allApprovedCleared && host && !qs('.demo-note', host)) {
        const note = document.createElement('div');
        note.className = 'demo-note';
        note.textContent = 'Цалин батлагдсан тул бүх жагсаалт цэвэрлэгдлээ.';
        host.appendChild(note);
      }
      syncTaxWidgets();
    }

    if (detailButton) detailButton.addEventListener('click', () => showPage('final-approval'));
    if (reviewButton) reviewButton.addEventListener('click', () => showPage('final-approval'));
    if (finalButton) {
      finalButton.addEventListener('click', () => {
        if (!seniorReady()) {
          showToast('Ахлах нягтлангийн баталгаажуулалт бүрэн дуусаагүй байна.');
          return;
        }
        clearAfterExecutiveApproval();
        addNotification('Удирдлага: 2026/03 сарын цалингийн бодолтыг эцэслэн баталж бүх жагсаалтыг цэвэрлэлээ.');
        saveState();
        updateAdminState();
        showToast('Цалингийн бодолт эцэслэн батлагдаж жагсаалтууд цэвэрлэгдлээ.');
      });
    }

    genericReportBinder();
    updateAdminState();
  }

  function initEmployeeDemo() {
    if (APP_CONFIG.fileName !== 'emp.html') return;
    const filterButtons = qsa('#salary-history .filter-btn');
    const latestSalaryBox = qsa('#profile .pay-card, #profile .card')[0];
    const downloadLinks = qsa('.download-link');
    const historyRows = qsa('#salary-history tbody tr');

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        filterButtons.forEach((btn) => btn.classList.remove('demo-active-filter'));
        button.classList.add('demo-active-filter');
        showToast(`“${buttonText(button)}” шүүлтүүр demo горимоор идэвхжлээ.`);
      });
    });

    downloadLinks.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const filename = index === 0 ? 'salary-history-all.txt' : 'salary-history.txt';
        const content = [
          'Цалингийн түүх',
          '2026/03 - 2,450,000₮',
          '2026/02 - 2,380,000₮',
          '2026/01 - 2,420,000₮'
        ].join('\n');
        downloadTextFile(filename, content, 'text/plain;charset=utf-8');
        showToast('Цалингийн түүх файл хэлбэрээр татагдлаа.');
      });
    });

    historyRows.forEach((row) => {
      const lastCell = row.lastElementChild;
      if (!lastCell || !lastCell.textContent.includes('PDF')) return;
      lastCell.style.cursor = 'pointer';
      lastCell.addEventListener('click', () => {
        downloadTextFile(`salary-slip-${row.firstElementChild.textContent.trim().replace('/', '-')}.txt`, row.textContent.replace(/\s+/g, ' ').trim(), 'text/plain;charset=utf-8');
        showToast('Цалингийн хуулга татагдлаа.');
      });
    });

    if (demoState.executive.finalApproved && latestSalaryBox) {
      const subtitle = qsa('#profile .tag')[1];
      if (subtitle) subtitle.textContent = 'Батлагдсан';
    }
  }

  function addInteractions() {
    document.querySelectorAll('button').forEach((button) => {
      const text = button.textContent.trim();
      if (!text) return;
      if (button.classList.contains('nav-link') || button.dataset.pageTarget) return;
      if (button.dataset.demoGenericBound === 'true') return;
      button.dataset.demoGenericBound = 'true';
      if (text.includes('Шалгах')) {
        button.addEventListener('click', () => showToast('Дэлгэрэнгүй шалгалтын цонх demo горимоор нээгдлээ.'));
      } else if (text.includes('Тайлан')) {
        button.addEventListener('click', () => showToast('Тайлангийн preview demo горимоор нээгдлээ.'));
      }
    });
  }

  function initPage() {
    if (!ensureAccess()) return;
    normalizeTimesheetState();
    bindNavigation();
    bindLogout();
    addHeaderBadge();
    addInteractions();
    injectSessionMeta();
    renderGlobalTaxNote();
    syncTaxWidgets();
    initHrDemo();
    initAccDemo();
    initSeniorDemo();
    initAdminDemo();
    initEmployeeDemo();
  }

  function refreshCurrentPageFromStorage() {
    demoState = loadState();
    normalizeTimesheetState();
    renderGlobalTaxNote();
    syncTaxWidgets();
    initHrDemo();
    initAccDemo();
    initSeniorDemo();
    initAdminDemo();
    initEmployeeDemo();
  }

  window.addEventListener('storage', (event) => {
    if (event.key === DEMO_STATE_KEY) {
      refreshCurrentPageFromStorage();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshCurrentPageFromStorage();
    }
  });

  window.PayrollDemo = { showToast, showPage, session, users: USERS, get state() { return demoState; } };
  initPage();
})();
