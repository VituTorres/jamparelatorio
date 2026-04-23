import { renderLogin, openPwModal, closePwModal, checkPw, logout } from './views/login.js';
import { changeDay, setDay, addCabToSvc, removeCabFromSvc, toggle } from './views/driver.js';
import { addService, delSvc, addDriver, rmDrv, changePw, genReport, exportPDF, exportCSV, registerSingleCab, registerBatchCabs, removeCab, renderCabList, toggleCabHistory, stab, updateDriverName, updateDriverPassword, renderAdminList } from './views/admin.js';

document.addEventListener('DOMContentLoaded', () => {
  renderLogin();

  // Static Elements
  document.getElementById('pw-input').addEventListener('keydown', e => { if (e.key === 'Enter') checkPw(); });
  document.getElementById('btn-modal-cancel').addEventListener('click', closePwModal);
  document.getElementById('btn-modal-confirm').addEventListener('click', checkPw);
  document.getElementById('btn-admin-login').addEventListener('click', openPwModal);
  
  document.querySelectorAll('.btn-logout').forEach(btn => btn.addEventListener('click', logout));
  document.getElementById('btn-prev-day').addEventListener('click', () => changeDay(-1));
  document.getElementById('btn-next-day').addEventListener('click', () => changeDay(1));
  document.getElementById('date-picker').addEventListener('change', e => setDay(e.target.value));

  document.getElementById('sub-btn').addEventListener('click', addService);

  document.getElementById('filter-drv').addEventListener('change', renderAdminList);
  document.getElementById('filter-date').addEventListener('change', renderAdminList);

  document.getElementById('nd-pw-inp').addEventListener('keydown', e => { if (e.key === 'Enter') addDriver(); });
  document.getElementById('btn-add-driver').addEventListener('click', addDriver);

  document.getElementById('cab-reg-num').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); registerSingleCab(); } });
  document.getElementById('btn-reg-single-cab').addEventListener('click', registerSingleCab);
  document.getElementById('btn-reg-batch-cab').addEventListener('click', registerBatchCabs);
  document.getElementById('cab-search').addEventListener('input', renderCabList);
  document.getElementById('cab-filter-status').addEventListener('change', renderCabList);

  document.getElementById('rpt-period').addEventListener('change', function() {
    document.getElementById('custom-dates').style.display = this.value === 'custom' ? 'flex' : 'none';
  });
  document.getElementById('btn-gen-report').addEventListener('click', genReport);
  document.getElementById('btn-exp-pdf').addEventListener('click', exportPDF);
  document.getElementById('btn-exp-csv').addEventListener('click', exportCSV);

  document.getElementById('btn-change-pw').addEventListener('click', changePw);
});

// Dynamic Elements via Event Delegation
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  
  if (action === 'remove-cab-svc') removeCabFromSvc(btn.dataset.id, parseInt(btn.dataset.idx));
  else if (action === 'add-cab-svc') addCabToSvc(btn.dataset.id);
  else if (action === 'toggle-svc') toggle(btn.dataset.id);
  else if (action === 'del-svc') delSvc(btn.dataset.id);
  else if (action === 'rm-drv') rmDrv(parseInt(btn.dataset.idx));
  else if (action === 'toggle-cab-hist') toggleCabHistory(btn.dataset.num);
  else if (action === 'remove-cab') removeCab(btn.dataset.num);
  else if (action === 'stab') stab(btn.dataset.tabId, parseInt(btn.dataset.tabIdx));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const input = e.target.closest('[data-action]');
    if (!input) return;
    if (input.dataset.action === 'input-cab-svc') {
      e.preventDefault(); addCabToSvc(input.dataset.id);
    }
  }
});

document.addEventListener('change', (e) => {
  const input = e.target.closest('[data-action]');
  if (!input) return;
  const action = input.dataset.action;
  if (action === 'update-drv-name') updateDriverName(parseInt(input.dataset.idx), input.value);
  else if (action === 'update-drv-pw') updateDriverPassword(parseInt(input.dataset.idx), input.value);
});