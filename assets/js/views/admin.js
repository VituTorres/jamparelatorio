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

export function updateDriverName(i,v){
  const nv=(v||'').trim(); if(!nv){alert('O nome não pode ficar vazio.');renderDrvAdmin();return;}
  const old=ST.drivers[i].name; if(old===nv)return;
  if(ST.drivers.some((x,j)=>j!==i&&x.name===nv)){alert('Já existe um motorista.');renderDrvAdmin();return;}
  ST.drivers[i].name=nv; ST.services.forEach(s=>{if(s.driver===old)s.driver=nv;}); save();renderAdminDriverSelect();renderAdminList();renderLogin();
}

export async function updateDriverPassword(i,v){
  const nv=(v||'').trim(); if(!nv||nv.length<3){alert('Senha mín. 3 caracteres.');renderDrvAdmin();return;}
  ST.drivers[i].password = await hashPassword(nv);
  save(); alert('Senha atualizada!');
}

export async function addDriver(){
  const nIn=document.getElementById('nd-inp'), pIn=document.getElementById('nd-pw-inp');
  const n=(nIn.value||'').trim(), pw=(pIn.value||'').trim();
  if(!n||!pw||pw.length<3){alert('Preencha nome e senha (mín 3).');return;}
  if(ST.drivers.some(x=>x.name===n)){alert('Já existe.');return;}
  ST.drivers.push({name:n,password:await hashPassword(pw)}); 
  save(); nIn.value='';pIn.value='';
  renderDrvAdmin();renderAdminDriverSelect();renderLogin();
}

export function rmDrv(i){if(!confirm('Remover?'))return;ST.drivers.splice(i,1);save();renderDrvAdmin();renderAdminDriverSelect();renderLogin();}

export function addService(){
  const date=document.getElementById('f-date').value, cl=document.getElementById('f-cl').value.trim();
  const ad=document.getElementById('f-ad').value.trim(), tp=document.getElementById('f-tp').value, dr=document.getElementById('f-dr').value;
  const qtd = parseInt(document.getElementById('f-qtd-cab').value);
  if(!date||!ad||!tp||!dr||isNaN(qtd)){alert('Preencha todos os campos obrigatórios.');return;}
  ST.services.push({id:Date.now().toString(),client:cl,address:ad,type:tp,cacambas:[],qtd:qtd,driver:dr,done:false,serviceDate:date});
  save();
  ['f-cl','f-ad','f-tp','f-dr','f-qtd-cab'].forEach(id=>document.getElementById(id).value='');
  const btn=document.getElementById('sub-btn');btn.textContent='✓ Cadastrado!';btn.style.background='var(--gr)';
  setTimeout(()=>{btn.textContent='Cadastrar Serviço';btn.style.background='';},1600);
}

export function delSvc(id){if(!confirm('Remover?'))return;ST.services=ST.services.filter(s=>s.id!==id);save();renderAdminList();}

export async function changePw(){
  const cur=document.getElementById('pw-cur').value, nw=document.getElementById('pw-new').value, nw2=document.getElementById('pw-new2').value, msg=document.getElementById('pw-msg');
  const hashedCur = await hashPassword(cur);
  if(hashedCur!==ST.adminPw){msg.style.color='var(--re)';msg.textContent='Senha atual incorreta.';return;}
  if(!nw||nw.length<3||nw!==nw2){msg.style.color='var(--re)';msg.textContent='Verifique a nova senha.';return;}
  ST.adminPw = await hashPassword(nw); save(); 
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

function periodLabel(){
  const p=document.getElementById('rpt-period').value, now=new Date();
  if(p==='today')return now.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});
  if(p==='week')return 'Esta semana';
  if(p==='month')return now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  return (document.getElementById('rpt-from').value||'')+' → '+(document.getElementById('rpt-to').value||'');
}

export function genReport(){
  const svcs=getFilteredSvcs(), drv=document.getElementById('rpt-driver').value;
  const total=svcs.length, ent=svcs.filter(s=>s.type==='entrega').length, ret=svcs.filter(s=>s.type==='retirada').length;
  const tro=svcs.filter(s=>s.type==='troca').length, done=svcs.filter(s=>s.done).length, pend=total-done;
  const totalC=svcs.reduce((a,s)=>a+(s.cacambas||[]).length,0);
  let html=`<div class="rpt-section"><div class="rpt-sech">📊 Relatório</div><div style="padding:11px 13px"><div class="stats-grid"><div class="stat-card"><div class="stat-label">Serviços</div><div class="stat-val">${total}</div></div><div class="stat-card"><div class="stat-label">Caçambas</div><div class="stat-val">${totalC}</div></div><div class="stat-card"><div class="stat-label">Feitos</div><div class="stat-val ok">${done}</div></div><div class="stat-card"><div class="stat-label">Pendentes</div><div class="stat-val pend">${pend}</div></div></div></div></div>`;
  document.getElementById('rpt-out').innerHTML=html;
  document.getElementById('exp-row').style.display=svcs.length?'flex':'none';
  window._rptSvcs=svcs;
  window._rptLabel=periodLabel();
  window._rptDrv=drv;
}

export function exportPDF(){
  const svcs=window._rptSvcs||[], lbl=window._rptLabel||'', drv=window._rptDrv||'';
  if(!svcs.length){alert('Nenhum serviço para exportar. Gere um relatório primeiro.');return;}
  const done=svcs.filter(s=>s.done).length, pct=svcs.length?Math.round(done/svcs.length*100):0;
  const ent=svcs.filter(s=>s.type==='entrega').length, ret=svcs.filter(s=>s.type==='retirada').length, tro=svcs.filter(s=>s.type==='troca').length;
  const totalC=svcs.reduce((a,s)=>a+((s.cacambas||[]).filter(c=>c)).length,0);
  const rows=svcs.map(s=>{
    const t={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[s.type]||'';
    const cabs=((s.cacambas||[s.num||'?']).filter(c=>c)).join(', ');
    return `<tr style="border-bottom:1px solid #e5e3dc"><td style="padding:6px 8px;font-size:12px">${_escHtml(s.serviceDate||'')}</td><td style="padding:6px 8px;font-size:12px">${_escHtml(s.address||'')}</td><td style="padding:6px 8px;font-size:12px">${t}</td><td style="padding:6px 8px;font-size:12px">${_escHtml(cabs)}</td><td style="padding:6px 8px;font-size:12px">${_escHtml(s.driver||'')}</td><td style="padding:6px 8px;font-size:12px;font-weight:600;color:${s.done?'#1B5E20':'#A32D2D'}">${s.done?'Concluído':'Pendente'}</td></tr>`;
  }).join('');
  const w=window.open('','_blank');
  if(!w){alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');return;}
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório Jampa Caçambas</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#1a1917}h1{color:#2E7D32;font-size:18px;margin-bottom:3px}.sub{color:#6b6963;font-size:12px;margin-bottom:20px}.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.sc{border:1px solid #e2e0d8;border-radius:7px;padding:10px}.sl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}.sv{font-size:20px;font-weight:700}table{width:100%;border-collapse:collapse}th{background:#F8F7F4;padding:7px 8px;font-size:10px;text-align:left;border-bottom:2px solid #e2e0d8;color:#6b6963;text-transform:uppercase}@media print{body{padding:14px}}</style></head><body><h1>Jampa Caçambas — Relatório</h1><div class="sub">${_escHtml(lbl)}${drv?' · '+_escHtml(drv):''} · Gerado em ${new Date().toLocaleString('pt-BR')}</div><div class="sg"><div class="sc"><div class="sl">Serviços</div><div class="sv">${svcs.length}</div></div><div class="sc"><div class="sl">Caçambas</div><div class="sv">${totalC}</div></div><div class="sc"><div class="sl">Concluídos</div><div class="sv" style="color:#1B5E20">${done}</div></div><div class="sc"><div class="sl">Taxa</div><div class="sv">${pct}%</div></div></div><p style="font-size:11px;color:#6b6963;margin-bottom:14px">📦 ${ent} Entregas &nbsp;♻️ ${ret} Retiradas &nbsp;🔄 ${tro} Trocas</p><table><thead><tr><th>Data</th><th>Endereço</th><th>Tipo</th><th>Caçambas</th><th>Motorista</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>`);
  w.document.close();
}

function _setCabMsg(id,txt,ok){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=txt; el.style.color=ok?'var(--gr)':'var(--re)';
  setTimeout(()=>el.textContent='',3500);
}

export function registerSingleCab(){
    const inp=document.getElementById('cab-reg-num');
    const num = inp.value.trim();
    if(!num){_setCabMsg('cab-reg-msg','Informe o número.',false);return;}
    if(ST.cacambas.some(c=>c.num===num)){_setCabMsg('cab-reg-msg','Já cadastrada.',false);return;}
    ST.cacambas.push({num, createdAt: new Date().toISOString()});
    save(); inp.value=''; renderCabList(); _setCabMsg('cab-reg-msg','✓ Cadastrada!',true);
}

// FUNÇÃO DE LOTE ATUALIZADA PARA FIREBASE
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
    await save(); // Espera o Firebase confirmar
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

export function removeCab(num){if(confirm('Remover caçamba '+num+'?')){ST.cacambas=ST.cacambas.filter(c=>c.num!==num);save();renderCabList();}}

export function renderCabList(){
  const list=document.getElementById('cab-list'); if(!list)return;
  list.innerHTML='';
  const sorted = [...ST.cacambas].sort((a,b)=>parseInt(a.num)-parseInt(b.num));
  sorted.forEach(c=>{
    const row=document.createElement('div'); row.className='admin-list-item';
    row.innerHTML=`<div style="flex:1">🟫 <strong>${c.num}</strong></div><button class="btn-delete" data-action="remove-cab" data-num="${c.num}">🗑</button>`;
    list.appendChild(row);
  });
}