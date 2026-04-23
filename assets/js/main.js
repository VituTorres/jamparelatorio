import { initApp } from './state.js'; 
import { renderLogin, openPwModal, closePwModal, checkPw, logout } from './views/login.js';
import { changeDay, setDay, addCabToSvc, removeCabFromSvc, toggle } from './views/driver.js';
import { addService, delSvc, addDriver, rmDrv, changePw, genReport, exportPDF, exportCSV, registerSingleCab, registerBatchCabs, removeCab, renderCabList, toggleCabHistory, stab, updateDriverName, updateDriverPassword, renderAdminList } from './views/admin.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingMsg = document.createElement('div');
  loadingMsg.style = "position:fixed;inset:0;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-weight:bold;color:#2E7D32";
  loadingMsg.innerHTML = "Conectando à nuvem... ☁️";
  document.body.appendChild(loadingMsg);

  try {
    await initApp(); 
    loadingMsg.remove();
    renderLogin();
  } catch (err) {
    loadingMsg.innerHTML = "❌ Erro de Permissão. Verifique o console do Firebase.";
    return;
  }

  document.getElementById('btn-admin-login').onclick = openPwModal;
  document.getElementById('btn-modal-cancel').onclick = closePwModal;
  document.getElementById('btn-modal-confirm').onclick = checkPw;
  document.getElementById('pw-input').onkeydown = e => { if(e.key==='Enter') checkPw(); };
  
  document.querySelectorAll('.btn-logout').forEach(b => b.onclick = logout);
  document.getElementById('btn-prev-day').onclick = () => changeDay(-1);
  document.getElementById('btn-next-day').onclick = () => changeDay(1);
  document.getElementById('date-picker').onchange = e => setDay(e.target.value);
  document.getElementById('sub-btn').onclick = addService;
  document.getElementById('btn-add-driver').onclick = addDriver;
  document.getElementById('btn-reg-single-cab').onclick = registerSingleCab;
  document.getElementById('btn-reg-batch-cab').onclick = registerBatchCabs;
  document.getElementById('btn-gen-report').onclick = genReport;
  document.getElementById('btn-change-pw').onclick = changePw;
});

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const a = btn.dataset;
  if(a.action === 'stab') stab(a.tabId, parseInt(a.tabIdx));
  if(a.action === 'add-cab-svc') addCabToSvc(a.id);
  if(a.action === 'remove-cab-svc') removeCabFromSvc(a.id, parseInt(a.idx));
  if(a.action === 'toggle-svc') toggle(a.id);
  if(a.action === 'del-svc') delSvc(a.id);
  if(a.action === 'remove-cab') removeCab(a.num);
});