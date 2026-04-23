import { ST, AppState, save, TODAY } from '../state.js';
import { _escHtml, showScreen, hashPassword } from '../utils.js';
import { renderLogin } from './login.js';

export function goAdmin(){
  showScreen('s-admin');
  renderAdminDriverSelect();
  document.getElementById('f-date').value=TODAY;
  document.getElementById('filter-date').value='';
  renderAdminList();
  renderRptFilters();
}

export function stab(id,idx){
  document.querySelectorAll('.tab-panel').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tab')[idx].classList.add('active');
  if(id==='t-list')renderAdminList();
  if(id==='t-drv')renderDrvAdmin();
  if(id==='t-cab')renderCabList();
  if(id==='t-rpt'){renderRptFilters();document.getElementById('rpt-out').innerHTML='';document.getElementById('exp-row').style.display='none';}
}

export function renderAdminDriverSelect(){
  ['f-dr','filter-drv','rpt-driver'].forEach(sid=>{
    const sel=document.getElementById(sid);if(!sel)return;
    const v=sel.value;
    sel.innerHTML=sid==='f-dr'?'<option value="">Selecione...</option>':'<option value="">Todos os motoristas</option>';
    ST.drivers.forEach(d=>{const o=document.createElement('option');o.value=d.name;o.textContent=d.name;sel.appendChild(o);});
    sel.value=v;
  });
}

export function renderAdminList(){
  const list=document.getElementById('admin-list');if(!list)return;
  const drvF=document.getElementById('filter-drv').value, dateF=document.getElementById('filter-date').value;
  let svcs=ST.services.filter(s=>(!drvF||s.driver===drvF)&&(!dateF||s.serviceDate===dateF));
  if(!svcs.length){list.innerHTML='<div class="no-data" style="border:none">Nenhum serviço encontrado.</div>';return;}
  list.innerHTML='';
  [...svcs].reverse().forEach(sv=>{
    const lbl={entrega:'📦 Entrega',retirada:'♻️ Retirada',troca:'🔄 Troca'}[sv.type];
    const cabs=sv.cacambas||[];
    const expected = sv.qtd || cabs.length;
    const cabHtml = cabs.length > 0 
      ? cabs.map(c=>`<span class="cab-tag" style="font-size:10px;padding:1px 5px">${c}</span>`).join('')
      : `<span style="font-size:11px;color:var(--mu);font-weight:600">${expected} caçamba(s) solicitada(s)</span>`;
    const it=document.createElement('div');it.className='admin-list-item';
    it.innerHTML=`<span class="admin-list-item__badge ${sv.type}">${lbl}</span><div class="admin-list-item__info"><div class="admin-list-item__address">${sv.address}</div><div class="admin-list-item__meta">${sv.serviceDate} · ${sv.driver}${sv.client?' · '+sv.client:''}</div><div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">${cabHtml}</div></div><span class="admin-list-item__status ${sv.done?'d':'p'}">${sv.done?'Feito':'Pend.'}</span><button class="btn-delete" data-action="del-svc" data-id="${sv.id}">🗑</button>`;
    list.appendChild(it);
  });
}

export function renderDrvAdmin(){
  const list=document.getElementById('drv-admin');if(!list)return;list.innerHTML='';
  ST.drivers.forEach((d,i)=>{
    const r=document.createElement('div');r.className='driver-mgmt-row'; r.style.flexWrap='wrap'; r.style.gap='6px';
    const nameSafe=(d.name||'').replace(/"/g,'&quot;'), pwSafe=(d.password||'').replace(/"/g,'&quot;');
    r.innerHTML=`<div style="display:flex;gap:7px;width:100%;align-items:center"><input class="driver-mgmt-input" placeholder="Nome" value="${nameSafe}" data-action="update-drv-name" data-idx="${i}" style="flex:1"><button class="btn-remove-driver" data-action="rm-drv" data-idx="${i}">✕</button></div><input class="driver-mgmt-input" type="password" placeholder="Senha (mín. 3)" value="${pwSafe}" autocomplete="new-password" data-action="update-drv-pw" data-idx="${i}" style="width:100%">`;
    list.appendChild(r);
  });
}

export async function updateDriverName(i,v){
  const nv=(v||'').trim(); if(!nv){alert('O nome não pode ficar vazio.');renderDrvAdmin();return;}
  const old=ST.drivers[i].name; if(old===nv)return;
  if(ST.drivers.some((x,j)=>j!==i&&x.name===nv)){alert('Já existe um motorista.');renderDrvAdmin();return;}
  ST.drivers[i].name=nv; ST.services.forEach(s=>{if(s.driver===old)s.driver=nv;}); 
  await save();
  renderAdminDriverSelect();renderAdminList();renderLogin();
}

export async function updateDriverPassword(i,v){
  const nv=(v||'').trim(); if(!nv||nv.length<3){alert('Senha mín. 3 caracteres.');renderDrvAdmin();return;}
  ST.drivers[i].password = await hashPassword(nv);
  await save(); alert('Senha atualizada!');
}

export async function addDriver(){
  const nIn=document.getElementById('nd-inp'), pIn=document.getElementById('nd-pw-inp');
  const n=(nIn.value||'').trim(), pw=(pIn.value||'').trim();
  if(!n||!pw||pw.length<3){alert('Preencha nome e senha (mín 3).');return;}
  if(ST.drivers.some(x=>x.name===n)){alert('Já existe.');return;}
  ST.drivers.push({name:n,password:await hashPassword(pw)}); 
  await save(); nIn.value='';pIn.value='';
  renderDrvAdmin();renderAdminDriverSelect();renderLogin();
}

export async function rmDrv(i){
  if(!confirm('Remover?'))return;
  ST.drivers.splice(i,1);
  await save();
  renderDrvAdmin();renderAdminDriverSelect();renderLogin();
}

export async function addService(){
  const date=document.getElementById('f-date').value, cl=document.getElementById('f-cl').value.trim();
  const ad=document.getElementById('f-ad').value.trim(), tp=document.getElementById('f-tp').value, dr=document.getElementById('f-dr').value;
  const qtd = parseInt(document.getElementById('f-qtd-cab').value);
  if(!date||!ad||!tp||!dr||isNaN(qtd)){alert('Preencha todos os campos obrigatórios.');return;}
  
  const btn=document.getElementById('sub-btn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Salvando...";

  ST.services.push({id:Date.now().toString(),client:cl,address:ad,type:tp,cacambas:[],qtd:qtd,driver:dr,done:false,serviceDate:date});
  
  try {
    await save();
    ['f-cl','f-ad','f-tp','f-dr','f-qtd-cab'].forEach(id=>document.getElementById(id).value='');
    btn.textContent='✓ Cadastrado!';btn.style.background='var(--gr)';
    setTimeout(()=>{btn.textContent='Cadastrar Serviço';btn.style.background=''; btn.disabled = false;},1600);
    renderAdminList();
  } catch (err) {
    alert("Erro ao salvar serviço no Firebase.");
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

export async function delSvc(id){
  if(!confirm('Remover?'))return;
  const sv = ST.services.find(s => s.id === id);
  if (sv && sv.cacambas) {
    // Liberar caçambas apenas se for uma ENTREGA
    // Se for RETIRADA ou TROCA, as caçambas já devem estar em uso
    if (sv.type === 'entrega') {
      sv.cacambas.forEach(num => {
        const cab = ST.cacambas.find(c => c.num === num);
        if (cab) {
          delete cab.status;
          delete cab.servicoId;
          delete cab.endereco;
        }
      });
    } else if (sv.type === 'retirada' || sv.type === 'troca') {
      // Se for retirada ou troca, apenas remove o vínculo de retirada
      sv.cacambas.forEach(num => {
        const cab = ST.cacambas.find(c => c.num === num);
        if (cab) {
          delete cab.retiradaServiceId;
        }
      });
    }
  }
  ST.services=ST.services.filter(s=>s.id!==id);
  await save();
  renderAdminList();
  if(document.getElementById('t-cab').classList.contains('active')) renderCabList();
}

export async function changePw(){
  const cur=document.getElementById('pw-cur').value, nw=document.getElementById('pw-new').value, nw2=document.getElementById('pw-new2').value, msg=document.getElementById('pw-msg');
  const hashedCur = await hashPassword(cur);
  if(hashedCur!==ST.adminPw){msg.style.color='var(--re)';msg.textContent='Senha atual incorreta.';return;}
  if(!nw||nw.length<3||nw!==nw2){msg.style.color='var(--re)';msg.textContent='Verifique a nova senha.';return;}
  ST.adminPw = await hashPassword(nw); 
  await save(); 
  ['pw-cur','pw-new','pw-new2'].forEach(id=>document.getElementById(id).value='');
  msg.style.color='var(--gr)';msg.textContent='✓ Senha alterada!'; setTimeout(()=>msg.textContent='',3000);
}

export function renderRptFilters(){renderAdminDriverSelect();document.getElementById('rpt-from').value=TODAY;document.getElementById('rpt-to').value=TODAY;}
function getFilteredSvcs(){
  const drvF=document.getElementById('rpt-driver').value, p=document.getElementById('rpt-period').value, now=new Date();let from,to;
  if(p==='today'){from=to=TODAY;}else if(p==='week'){const d=new Date(now);d.setDate(d.getDate()-d.getDay());from=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;to=TODAY;}
  else if(p==='month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';to=TODAY;}
  else{from=document.getElementById('rpt-from').value;to=document.getElementById('rpt-to').value;}
  return ST.services.filter(s=>{const d=s.serviceDate||TODAY;return d>=from&&d<=to&&(!drvF||s.driver===drvF);});
}

export function genReport(){
  const svcs=getFilteredSvcs(), drv=document.getElementById('rpt-driver').value;
  const total=svcs.length, ent=svcs.filter(s=>s.type==='entrega').length, ret=svcs.filter(s=>s.type==='retirada').length;
  const tro=svcs.filter(s=>s.type==='troca').length, done=svcs.filter(s=>s.done).length, pend=total-done;
  // Contar apenas caçambas de colocações (Entrega e Troca)
  const totalC = svcs.reduce((a, s) => {
    if (s.type === 'entrega' || s.type === 'troca') {
      return a + (s.cacambas || []).length;
    }
    return a;
  }, 0);
  let html=`<div class="rpt-section"><div class="rpt-sech">📊 Relatório</div><div style="padding:11px 13px"><div class="stats-grid"><div class="stat-card"><div class="stat-label">Serviços</div><div class="stat-val">${total}</div></div><div class="stat-card"><div class="stat-label">Caçambas (Coloc.)</div><div class="stat-val">${totalC}</div></div><div class="stat-card"><div class="stat-label">Feitos</div><div class="stat-val ok">${done}</div></div><div class="stat-card"><div class="stat-label">Pendentes</div><div class="stat-val pend">${pend}</div></div></div></div></div>`;
  document.getElementById('rpt-out').innerHTML=html;
  document.getElementById('exp-row').style.display=svcs.length?'flex':'none';
  window._rptSvcs=svcs;
}

export function exportPDF(){
  const svcs = window._rptSvcs;
  if(!svcs || !svcs.length){ alert('Gere o relatório primeiro.'); return; }

  const drvF = document.getElementById('rpt-driver').value || 'Todos os motoristas';
  const p = document.getElementById('rpt-period').value;
  const periodLabels = { today:'Hoje', week:'Esta semana', month:'Este mês', custom:'Personalizado' };
  const periodLabel = periodLabels[p] || p;
  const fromVal = document.getElementById('rpt-from').value;
  const toVal   = document.getElementById('rpt-to').value;
  const dateRange = p === 'custom' ? ` (${fromVal} → ${toVal})` : '';

  const total = svcs.length;
  const ent   = svcs.filter(s=>s.type==='entrega').length;
  const ret   = svcs.filter(s=>s.type==='retirada').length;
  const tro   = svcs.filter(s=>s.type==='troca').length;
  const done  = svcs.filter(s=>s.done).length;
  const pend  = total - done;
  // Contar apenas caçambas de colocações (Entrega e Troca)
  const totalC = svcs.reduce((a, s) => {
    if (s.type === 'entrega' || s.type === 'troca') {
      return a + (s.cacambas || []).length;
    }
    return a;
  }, 0);

  const typeLabel = { entrega:'📦 Entrega', retirada:'♻️ Retirada', troca:'🔄 Troca' };

  const rows = [...svcs].sort((a,b)=>{
    if(a.serviceDate < b.serviceDate) return -1;
    if(a.serviceDate > b.serviceDate) return 1;
    return 0;
  }).map(sv=>{
    const cabs = (sv.cacambas||[]).join(', ') || '—';
    const status = sv.done ? '✅ Feito' : '⏳ Pendente';
    return `<tr>
      <td>${sv.serviceDate||'—'}</td>
      <td>${sv.driver||'—'}</td>
      <td>${typeLabel[sv.type]||sv.type}</td>
      <td>${sv.address||'—'}</td>
      <td>${sv.client||'—'}</td>
      <td>${cabs}</td>
      <td>${status}</td>
    </tr>`;
  }).join('');

  const now = new Date().toLocaleString('pt-BR');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Jampa Caçambas</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1917; margin: 0; padding: 20px; }
  h1 { font-size: 18px; color: #2E7D32; margin-bottom: 4px; }
  .subtitle { font-size: 11px; color: #6b6963; margin-bottom: 16px; }
  .stats { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .stat { background: #F8F7F4; border: 1px solid #e2e0d8; border-radius: 8px; padding: 8px 14px; min-width: 90px; }
  .stat-label { font-size: 9px; color: #6b6963; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
  .stat-val { font-size: 22px; font-weight: 700; color: #1a1917; }
  .stat-val.ok { color: #00C853; }
  .stat-val.pend { color: #A32D2D; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #2E7D32; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: .5px solid #e2e0d8; font-size: 11px; }
  tr:nth-child(even) td { background: #F8F7F4; }
  .footer { margin-top: 18px; font-size: 10px; color: #6b6963; text-align: right; }
  @media print { body { padding: 10px; } }
</style>
</head>
<body>
<h1>📊 Relatório — Jampa Caçambas</h1>
<div class="subtitle">Período: <strong>${periodLabel}${dateRange}</strong> &nbsp;|&nbsp; Motorista: <strong>${drvF}</strong> &nbsp;|&nbsp; Gerado em: ${now}</div>
<div class="stats">
  <div class="stat"><div class="stat-label">Serviços</div><div class="stat-val">${total}</div></div>
  <div class="stat"><div class="stat-label">Entregas</div><div class="stat-val">${ent}</div></div>
  <div class="stat"><div class="stat-label">Retiradas</div><div class="stat-val">${ret}</div></div>
  <div class="stat"><div class="stat-label">Trocas</div><div class="stat-val">${tro}</div></div>
  <div class="stat"><div class="stat-label">Caçambas</div><div class="stat-val">${totalC}</div></div>
  <div class="stat"><div class="stat-label">Feitos</div><div class="stat-val ok">${done}</div></div>
  <div class="stat"><div class="stat-label">Pendentes</div><div class="stat-val pend">${pend}</div></div>
</div>
<table>
  <thead><tr><th>Data</th><th>Motorista</th><th>Tipo</th><th>Endereço</th><th>Cliente</th><th>Caçambas</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Jampa Caçambas · Relatório gerado automaticamente em ${now}</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if(!win){ alert('Permita pop-ups para exportar o PDF.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

export function exportCSV(){}

function _setCabMsg(id,txt,ok){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=txt; el.style.color=ok?'var(--gr)':'var(--re)';
  setTimeout(()=>el.textContent='',3500);
}

export async function registerSingleCab(){
    const inp=document.getElementById('cab-reg-num');
    const num = inp.value.trim();
    if(!num){_setCabMsg('cab-reg-msg','Informe o número.',false);return;}
    if(ST.cacambas.some(c=>c.num===num)){_setCabMsg('cab-reg-msg','Já cadastrada.',false);return;}
    
    const btn = document.getElementById('btn-reg-single-cab');
    btn.disabled = true;
    
    ST.cacambas.push({num, createdAt: new Date().toISOString()});
    try {
      await save();
      inp.value=''; renderCabList(); _setCabMsg('cab-reg-msg','✓ Cadastrada!',true);
    } catch (err) {
      _setCabMsg('cab-reg-msg','Erro ao salvar.',false);
    } finally {
      btn.disabled = false;
    }
}

export async function registerBatchCabs(){
  const fromV=parseInt(document.getElementById('cab-batch-from').value,10);
  const toV=parseInt(document.getElementById('cab-batch-to').value,10);
  const msgId = 'cab-batch-msg';
  
  if(isNaN(fromV) || isNaN(toV) || fromV < 1 || toV < fromV){
    _setCabMsg(msgId,'Intervalo inválido.',false);
    return;
  }
  
  const btn = document.getElementById('btn-reg-batch-cab');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Salvando na Nuvem...";

  let added=0;
  const now=new Date().toISOString();
  
  for(let n=fromV; n<=toV; n++){
    const num=String(n);
    if(!ST.cacambas.some(c=>c.num===num)){
      ST.cacambas.push({num, createdAt:now});
      added++;
    }
  }

  try {
    await save(); 
    renderCabList();
    _setCabMsg(msgId, `✓ ${added} caçambas geradas!`, true);
    document.getElementById('cab-batch-from').value = '';
    document.getElementById('cab-batch-to').value = '';
  } catch (err) {
    _setCabMsg(msgId, 'Erro ao salvar lote.', false);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

export async function removeCab(num){
  const cab = ST.cacambas.find(c => c.num === num);
  if (cab && cab.status === 'Em uso') {
    alert('❌ Não é possível remover uma caçamba que está em uso.\n\nAguarde a conclusão da retirada.');
    return;
  }
  
  if(confirm('Remover caçamba '+num+'?')){
    ST.cacambas=ST.cacambas.filter(c=>c.num!==num);
    await save();
    renderCabList();
  }
}

export function renderCabList(){
  const list=document.getElementById('cab-list'); if(!list)return;
  list.innerHTML='';
  
  const search = document.getElementById('cab-search')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('cab-filter-status')?.value || '';
  
  let filtered = ST.cacambas.filter(c => {
    const matchesSearch = c.num.toLowerCase().includes(search);
    const status = c.status || 'Disponível';
    const matchesStatus = !filterStatus || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a,b)=>parseInt(a.num)-parseInt(b.num));
  
  const info = document.getElementById('cab-count-info');
  if(info) info.textContent = `${sorted.length} de ${ST.cacambas.length}`;

  sorted.forEach(c=>{
    const status = c.status || 'Disponível';
    const isUso = status === 'Em uso';
    const row=document.createElement('div'); row.className='admin-list-item';
    
    let enderecoInfo = '';
    if (isUso && c.endereco) {
      enderecoInfo = `<div style="font-size:10px;color:var(--mu);margin-top:2px">📍 ${c.endereco}</div>`;
    }
    
    row.innerHTML=`
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px">
          <img src="assets/images/cacamba.png" style="width:18px;height:auto;vertical-align:middle;margin-right:4px"> <strong>${c.num}</strong>
          <span class="admin-list-item__status ${isUso?'p':'d'}" style="font-size:9px;padding:1px 5px">
            ${status}
          </span>
        </div>
        ${enderecoInfo}
      </div>
      <button class="btn-delete" data-action="remove-cab" data-num="${c.num}">🗑</button>
    `;
    list.appendChild(row);
  });
}

// Adicionar listeners para busca e filtro de caçambas
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('cab-search');
  const filter = document.getElementById('cab-filter-status');
  if(search) search.oninput = renderCabList;
  if(filter) filter.onchange = renderCabList;
});
