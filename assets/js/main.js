import { initApp } from './state.js'; 
import { renderLogin, openPwModal, closePwModal, checkPw, logout } from './views/login.js';
import { changeDay, setDay, addCabToSvc, removeCabFromSvc, toggle } from './views/driver.js';
import { addService, delSvc, addDriver, rmDrv, changePw, genReport, exportPDF, registerSingleCab, registerBatchCabs, removeCab, renderCabList, stab, updateDriverName, updateDriverPassword } from './views/admin.js';

// Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registrado!', reg))
      .catch(err => console.log('Erro ao registrar SW:', err));
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.createElement('div');
  loader.style = "position:fixed;inset:0;background:#fff;z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;";
  loader.innerHTML = `<div style="color:#2E7D32;font-weight:bold;margin-bottom:10px">Conectando ao Jampa Caçambas...</div><div style="font-size:12px;color:#666">Sincronizando com a nuvem ☁️</div>`;
  document.body.appendChild(loader);

  try {
    await initApp(); 
    loader.remove(); 
    renderLogin();   
  } catch (err) {
    loader.innerHTML = `<div style="color:red;font-weight:bold">Erro de Conexão ❌</div><div style="font-size:12px;margin-top:10px">Verifique as regras do Firebase.</div>`;
    return;
  }

  document.getElementById('btn-admin-login').onclick = openPwModal;
  document.getElementById('btn-modal-cancel').onclick = closePwModal;
  document.getElementById('btn-modal-confirm').onclick = checkPw;
  document.getElementById('pw-input').onkeydown = e => { if(e.key==='Enter') checkPw(); };
  
  document.getElementById('sub-btn').onclick = addService;
  document.getElementById('btn-add-driver').onclick = addDriver;
  document.getElementById('btn-reg-single-cab').onclick = registerSingleCab;
  document.getElementById('btn-reg-batch-cab').onclick = registerBatchCabs;
  document.getElementById('btn-gen-report').onclick = genReport;
  document.getElementById('btn-exp-pdf').onclick = exportPDF;
  document.getElementById('btn-change-pw').onclick = changePw;

  document.querySelectorAll('.btn-logout').forEach(b => b.onclick = logout);
  document.getElementById('btn-prev-day').onclick = () => changeDay(-1);
  document.getElementById('btn-next-day').onclick = () => changeDay(1);
  document.getElementById('date-picker').onchange = e => setDay(e.target.value);
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
  if(a.action === 'rm-drv') rmDrv(parseInt(a.idx));
});

document.addEventListener('change', e => {
  const input = e.target.closest('[data-action]');
  if(!input) return;
  if(input.dataset.action === 'update-drv-name') updateDriverName(parseInt(input.dataset.idx), input.value);
  if(input.dataset.action === 'update-drv-pw') updateDriverPassword(parseInt(input.dataset.idx), input.value);
});