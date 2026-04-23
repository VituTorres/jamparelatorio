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
    
    // Se há caçambas, exibe os chips. Senão, mostra quantas foram pedidas.
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
  if(ST.drivers.some((x,j)=>j!==i&&x.name===nv)){alert('Já existe um motorista com esse nome.');renderDrvAdmin();return;}
  ST.drivers[i].name=nv; ST.services.forEach(s=>{if(s.driver===old)s.driver=nv;}); save();renderAdminDriverSelect();renderAdminList();renderLogin();
}

export async function updateDriverPassword(i,v){
  const nv=(v||'').trim(); 
  if(!nv||nv.length<3){alert('A senha deve ter no mínimo 3 caracteres.');renderDrvAdmin();return;}
  ST.drivers[i].password = await hashPassword(nv);
  save();
  alert('Senha do motorista atualizada com sucesso!');
}

export async function addDriver(){
  const nIn=document.getElementById('nd-inp'), pIn=document.getElementById('nd-pw-inp');
  const n=(nIn.value||'').trim(), pw=(pIn.value||'').trim();
  if(!n){alert('Digite o nome.');return;} 
  if(!pw||pw.length<3){alert('Senha mín. 3 caracteres.');return;}
  if(ST.drivers.some(x=>x.name===n)){alert('Já existe um motorista com esse nome.');return;}
  const hashedPw = await hashPassword(pw);
  ST.drivers.push({name:n,password:hashedPw}); 
  save(); 
  nIn.value='';pIn.value='';
  renderDrvAdmin();renderAdminDriverSelect();renderLogin();
}

export function rmDrv(i){if(!confirm('Remover '+ST.drivers[i].name+'?'))return;ST.drivers.splice(i,1);save();renderDrvAdmin();renderAdminDriverSelect();renderLogin();}

export function addService(){
  const date=document.getElementById('f-date').value, cl=document.getElementById('f-cl').value.trim();
  const ad=document.getElementById('f-ad').value.trim(), tp=document.getElementById('f-tp').value, dr=document.getElementById('f-dr').value;
  
  const qtdInput = document.getElementById('f-qtd-cab').value;
  const qtd = parseInt(qtdInput);
  
  if(!date||!ad||!tp||!dr||isNaN(qtd)){
    alert('Preencha: Data, Endereço, Tipo, Quantidade de Caçambas e Motorista.');
    return;
  }
  
  ST.services.push({
    id:Date.now().toString(),
    client:cl,
    address:ad,
    type:tp,
    cacambas:[], 
    qtd:qtd,  // Salva a quantidade exigida no serviço
    driver:dr,
    done:false,
    serviceDate:date
  });
  save();
  
  ['f-cl','f-ad','f-tp','f-dr','f-qtd-cab'].forEach(id=>document.getElementById(id).value='');
  const btn=document.getElementById('sub-btn');btn.textContent='✓ Cadastrado!';btn.style.background='var(--gr)';
  setTimeout(()=>{btn.textContent='Cadastrar Serviço';btn.style.background='';},1600);
}

export function delSvc(id){if(!confirm('Remover serviço?'))return;ST.services=ST.services.filter(s=>s.id!==id);save();renderAdminList();}

export async function changePw(){
  const cur=document.getElementById('pw-cur').value;
  const nw=document.getElementById('pw-new').value;
  const nw2=document.getElementById('pw-new2').value;
  const msg=document.getElementById('pw-msg');
  
  const hashedCur = await hashPassword(cur);
  if(hashedCur!==ST.adminPw){msg.style.color='var(--re)';msg.textContent='Senha atual incorreta.';return;}
  if(!nw||nw.length<3){msg.style.color='var(--re)';msg.textContent='Nova senha curta.';return;}
  if(nw!==nw2){msg.style.color='var(--re)';msg.textContent='Senhas não conferem.';return;}
  
  ST.adminPw = await hashPassword(nw);
  save(); 
  ['pw-cur','pw-new','pw-new2'].forEach(id=>document.getElementById(id).value='');
  msg.style.color='var(--gr)';msg.textContent='✓ Senha alterada com sucesso!'; setTimeout(()=>msg.textContent='',3000);
}

// REPORTS
export function renderRptFilters(){renderAdminDriverSelect();document.getElementById('rpt-from').value=TODAY;document.getElementById('rpt-to').value=TODAY;}
function getFilteredSvcs(){
  const drvF=document.getElementById('rpt-driver').value, p=document.getElementById('rpt-period').value, now=new Date();let from,to;
  if(p==='today'){from=to=TODAY;}else if(p==='week'){const d=new Date(now);d.setDate(d.getDate()-d.getDay());from=d.toISOString().split('T')[0];to=TODAY;}
  else if(p==='month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';to=TODAY;}else{from=document.getElementById('rpt-from').value;to=document.getElementById('rpt-to').value;}
  return ST.services.filter(s=>{const d=s.serviceDate||TODAY;return d>=from&&d<=to&&(!drvF||s.driver===drvF);});
}
function periodLabel(){const p=document.getElementById('rpt-period').value,now=new Date();if(p==='today')return now.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});if(p==='week')return'Esta semana';if(p==='month')return now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return document.getElementById('rpt-from').value+' → '+document.getElementById('rpt-to').value;}

export function genReport(){
  const svcs=getFilteredSvcs(),drv=document.getElementById('rpt-driver').value;
  const total=svcs.length,ent=svcs.filter(s=>s.type==='entrega').length,ret=svcs.filter(s=>s.type==='retirada').length;
  const tro=svcs.filter(s=>s.type==='troca').length,done=svcs.filter(s=>s.done).length,pend=total-done;
  const pct=total>0?Math.round(done/total*100):0;
  const totalC=svcs.reduce((a,s)=>a+(s.cacambas||[]).length,0);
  let html=`<div class="rpt-section"><div class="rpt-sech">📊 ${periodLabel()}${drv?' · '+drv:''}</div><div style="padding:11px 13px"><div class="stats-grid"><div class="stat-card"><div class="stat-label">Serviços</div><div class="stat-val">${total}</div></div><div class="stat-card"><div class="stat-label">Caçambas</div><div class="stat-val">${totalC}</div></div><div class="stat-card"><div class="stat-label">Concluídos</div><div class="stat-val ok">${done}</div></div><div class="stat-card"><div class="stat-label">Pendentes</div><div class="stat-val pend">${pend}</div></div></div><div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap"><span style="background:var(--bll);color:var(--bld);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600">📦 ${ent}</span><span style="background:var(--grl);color:var(--grd);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600">♻️ ${ret}</span><span style="background:var(--aml);color:var(--amd);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600">🔄 ${tro}</span></div><div style="margin-top:9px"><div style="font-size:11px;color:var(--mu);margin-bottom:4px">Conclusão: ${pct}%</div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div></div></div>`;
  if(!drv&&ST.drivers.length>1){html+=`<div class="rpt-section"><div class="rpt-sech">👷 Por Motorista</div>`;ST.drivers.forEach(drv2=>{const ds=svcs.filter(s=>s.driver===drv2.name);if(!ds.length)return;const dd=ds.filter(s=>s.done).length,dp=Math.round(dd/ds.length*100),dc=ds.reduce((a,s)=>a+(s.cacambas||[]).length,0);html+=`<div class="report-row-driver"><div style="flex:1"><div style="font-size:13px;font-weight:600">${drv2.name}</div><div style="font-size:11px;color:var(--mu)">${ds.length} serviço${ds.length!==1?'s':''} · ${dc} caçamba${dc!==1?'s':''} · ${dd} feito${dd!==1?'s':''}</div><div class="progress-bar"><div class="progress-fill" style="width:${dp}%"></div></div></div><span class="rpt-st done" style="margin-left:8px">${dp}%</span></div>`;});html+=`</div>`;}
  if(svcs.length){html+=`<div class="rpt-section"><div class="rpt-sech">📋 Lista Detalhada</div>`;[...svcs.filter(s=>!s.done),...svcs.filter(s=>s.done)].forEach(s=>{const lbl={entrega:'📦 Entrega',retirada:'♻️ Retirada',troca:'🔄 Troca'}[s.type];const cabs=s.cacambas||[s.num||'?'];const cabHtml=cabs.map(c=>`<span class="cab-tag" style="font-size:10px;padding:1px 5px">${c}</span>`).join('');html+=`<div class="rpt-row"><span class="admin-list-item__badge ${s.type}">${lbl}</span><div class="rpt-row-info"><div class="rpt-addr">${s.address}</div><div class="rpt-meta">${s.serviceDate} · ${s.driver}${s.client?' · '+s.client:''}</div><div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">${cabHtml}</div></div><span class="rpt-st ${s.done?'done':'pend'}">${s.done?'Concluído':'Pendente'}</span></div>`;});html+=`</div>`;}
  else{html+=`<div class="no-data">Nenhum serviço no período.</div>`;}
  document.getElementById('rpt-out').innerHTML=html;
  document.getElementById('exp-row').style.display=svcs.length?'flex':'none';
  window._rptSvcs=svcs;window._rptLabel=periodLabel();window._rptDrv=drv;
}

export function exportPDF(){
  const svcs=window._rptSvcs||[],lbl=window._rptLabel||'',drv=window._rptDrv||'';
  const done=svcs.filter(s=>s.done).length,pct=svcs.length?Math.round(done/svcs.length*100):0;
  const ent=svcs.filter(s=>s.type==='entrega').length,ret=svcs.filter(s=>s.type==='retirada').length,tro=svcs.filter(s=>s.type==='troca').length;
  const totalC=svcs.reduce((a,s)=>a+(s.cacambas||[]).length,0);
  const rows=svcs.map(s=>{const t={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[s.type];const cabs=(s.cacambas||[s.num||'?']).join(', ');return`<tr style="border-bottom:1px solid #e5e3dc"><td style="padding:6px 8px;font-size:12px">${s.serviceDate}</td><td style="padding:6px 8px;font-size:12px">${s.address}</td><td style="padding:6px 8px;font-size:12px">${t}</td><td style="padding:6px 8px;font-size:12px">${cabs}</td><td style="padding:6px 8px;font-size:12px">${s.driver}</td><td style="padding:6px 8px;font-size:12px;font-weight:600;color:${s.done?'#1B5E20':'#A32D2D'}">${s.done?'Concluído':'Pendente'}</td></tr>`;}).join('');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#1a1917}h1{color:#2E7D32;font-size:18px;margin-bottom:3px}.sub{color:#6b6963;font-size:12px;margin-bottom:20px}.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.sc{border:1px solid #e2e0d8;border-radius:7px;padding:10px}.sl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}.sv{font-size:20px;font-weight:700}table{width:100%;border-collapse:collapse}th{background:#F8F7F4;padding:7px 8px;font-size:10px;text-align:left;border-bottom:2px solid #e2e0d8;color:#6b6963;text-transform:uppercase}@media print{body{padding:14px}}</style></head><body><h1>Jampa Caçambas — Relatório</h1><div class="sub">${lbl}${drv?' · '+drv:''} · Gerado em ${new Date().toLocaleString('pt-BR')}</div><div class="sg"><div class="sc"><div class="sl">Serviços</div><div class="sv">${svcs.length}</div></div><div class="sc"><div class="sl">Caçambas</div><div class="sv">${totalC}</div></div><div class="sc"><div class="sl">Concluídos</div><div class="sv" style="color:#1B5E20">${done}</div></div><div class="sc"><div class="sl">Taxa</div><div class="sv">${pct}%</div></div></div><p style="font-size:11px;color:#6b6963;margin-bottom:14px">📦 ${ent} Entregas &nbsp;♻️ ${ret} Retiradas &nbsp;🔄 ${tro} Trocas</p><table><thead><tr><th>Data</th><th>Endereço</th><th>Tipo</th><th>Caçambas</th><th>Motorista</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close();
}
export function exportCSV(){
  const svcs=window._rptSvcs||[],lbl=(window._rptLabel||'relatorio').replace(/[^a-zA-Z0-9]/g,'_');
  const rows=[['Data','Endereço','Tipo','Caçambas','Qtd','Motorista','Cliente','Status']];
  svcs.forEach(s=>{const t={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[s.type];const cabs=s.cacambas||[s.num||'?'];rows.push([s.serviceDate,s.address,t,cabs.join('; '),cabs.length,s.driver,s.client||'',s.done?'Concluído':'Pendente']);});
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`relatorio_${lbl}.csv`;a.click();
}

// CAÇAMBAS
function validateCabNum(v){const n=String(v==null?'':v).trim();if(!n)return{ok:false,msg:'Informe um número válido.'};if(n.length>20)return{ok:false,msg:'Número longo.'};if(!/^[0-9A-Za-z-]+$/.test(n))return{ok:false,msg:'Use apenas letras, números e hífen.'};return{ok:true,num:n};}
function getCabStatus(num){const closed=ST.services.filter(s=>(s.cacambas||[]).includes(num)&&s.done).sort((a,b)=>((b.serviceDate||'')+(b.id||'')).localeCompare((a.serviceDate||'')+(a.id||'')));if(!closed.length)return{status:'Disponível'};const latest=closed[0];if(latest.type==='entrega'||latest.type==='troca')return{status:'Em uso',address:latest.address};return{status:'Disponível'};}
function getCabHistory(num){return ST.services.filter(s=>(s.cacambas||[]).includes(num)).slice().sort((a,b)=>((b.serviceDate||'')+(b.id||'')).localeCompare((a.serviceDate||'')+(a.id||'')));}
function _setCabMsg(id,txt,ok){const el=document.getElementById(id);if(!el)return;el.textContent=txt||'';el.style.color=ok?'var(--gr)':'var(--re)';if(txt)setTimeout(()=>{if(el.textContent===txt)el.textContent='';},3500);}

export function registerSingleCab(){
  const inp=document.getElementById('cab-reg-num'),res=validateCabNum(inp.value);
  if(!res.ok){_setCabMsg('cab-reg-msg',res.msg,false);return;}
  if(ST.cacambas.some(c=>c.num===res.num)){_setCabMsg('cab-reg-msg','Caçamba nº '+res.num+' já está cadastrada.',false);return;}
  ST.cacambas.push({num:res.num,createdAt:new Date().toISOString()}); save(); inp.value='';inp.focus(); _setCabMsg('cab-reg-msg','✓ Cadastrada.',true); renderCabList();
}
export function registerBatchCabs(){
  const fromV=parseInt(document.getElementById('cab-batch-from').value,10), toV=parseInt(document.getElementById('cab-batch-to').value,10);
  if(!Number.isInteger(fromV)||!Number.isInteger(toV)||fromV<1||toV<1){_setCabMsg('cab-batch-msg','Inteiros > 0.',false);return;}
  if(toV<fromV){_setCabMsg('cab-batch-msg','Fim deve ser >= Início.',false);return;}
  if(toV-fromV+1>2000){_setCabMsg('cab-batch-msg','Máximo 2000.',false);return;}
  const existing=new Set(ST.cacambas.map(c=>c.num)); let added=0,skipped=0; const now=new Date().toISOString();
  for(let n=fromV;n<=toV;n++){const num=String(n);if(existing.has(num)){skipped++;continue;}ST.cacambas.push({num,createdAt:now});existing.add(num);added++;}
  save(); document.getElementById('cab-batch-from').value='';document.getElementById('cab-batch-to').value='';
  _setCabMsg('cab-batch-msg',`✓ ${added} cadastradas`+(skipped?` (${skipped} ignoradas)`:''),true); renderCabList();
}
export function removeCab(num){
  const s=getCabStatus(num); let warn='Remover caçamba nº '+num+'?';
  if(s.status==='Em uso')warn+='\n\n⚠️ Está EM USO em: '+(s.address||'');
  if(!confirm(warn))return; ST.cacambas=ST.cacambas.filter(c=>c.num!==num); save();renderCabList();
}
export function toggleCabHistory(num){const el=document.getElementById('cab-hist-'+num.replace(/[^a-zA-Z0-9_-]/g,'_'));if(el)el.style.display=el.style.display==='none'?'block':'none';}

export function renderCabList(){
  const list=document.getElementById('cab-list');if(!list)return;
  const q=(document.getElementById('cab-search').value||'').trim().toLowerCase(), stF=document.getElementById('cab-filter-status').value;
  const total=ST.cacambas.length, emUso=ST.cacambas.filter(c=>getCabStatus(c.num).status==='Em uso').length, disp=total-emUso;
  document.getElementById('cab-count-info').textContent=total?`${total} total · ${disp} disp · ${emUso} em uso`:'';
  const sorted=[...ST.cacambas].sort((a,b)=>{const na=parseInt(a.num,10),nb=parseInt(b.num,10);if(!isNaN(na)&&!isNaN(nb)&&String(na)===a.num&&String(nb)===b.num)return na-nb;return a.num.localeCompare(b.num,undefined,{numeric:true});});
  const rows=sorted.filter(c=>{if(q&&!c.num.toLowerCase().includes(q))return false;if(stF&&getCabStatus(c.num).status!==stF)return false;return true;});
  if(!total){list.innerHTML='<div class="no-data" style="border:none">Nenhuma cadastrada.</div>';return;}
  if(!rows.length){list.innerHTML='<div class="no-data" style="border:none">Nenhuma encontrada.</div>';return;}
  list.innerHTML='';
  rows.forEach(c=>{
    const s=getCabStatus(c.num), hist=getCabHistory(c.num), safeId=c.num.replace(/[^a-zA-Z0-9_-]/g,'_'), numAttr=_escHtml(c.num);
    const addrLine=s.address?('📍 '+_escHtml(s.address)):'<span style="color:var(--mu)">— sem alocação</span>';
    const histHtml=hist.map(h=>{const lbl={entrega:'📦 Entrega',retirada:'♻️ Retirada',troca:'🔄 Troca'}[h.type]||h.type;const st=h.done?'<span style="color:var(--grd);font-weight:700">✓ concluído</span>':'<span style="color:var(--re);font-weight:700">⏳ pendente</span>';return `<div style="font-size:11px;padding:4px 0;border-bottom:.5px dashed var(--br)"><strong>${_escHtml(h.serviceDate||'')}</strong> · ${lbl} · ${_escHtml(h.address||'')} · ${_escHtml(h.driver||'')} · ${st}</div>`;}).join('')||'<div style="font-size:11px;color:var(--mu);padding:4px 0">Sem histórico.</div>';
    const row=document.createElement('div');row.className='admin-list-item';row.style.flexWrap='wrap';
    row.innerHTML=`<div class="admin-list-item__info" style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:14px;font-weight:700">🟫 ${numAttr}</span><span class="admin-list-item__status ${s.status==='Em uso'?'p':'d'}">${s.status}</span></div><div class="admin-list-item__meta" style="margin-top:4px">${addrLine}</div><button class="exp-btn" style="margin-top:6px;padding:5px 10px;font-size:11px" data-action="toggle-cab-hist" data-num="${numAttr}">📜 Histórico (${hist.length})</button><div id="cab-hist-${safeId}" style="display:none;margin-top:6px;border-left:2px solid var(--br);padding:2px 0 2px 8px">${histHtml}</div></div><button class="btn-delete" data-action="remove-cab" data-num="${numAttr}">🗑</button>`;
    list.appendChild(row);
  });
}