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

// REPORTS
export function renderRptFilters(){renderAdminDriverSelect();document.getElementById('rpt-from').value=TODAY;document.getElementById('rpt-to').value=TODAY;}
function getFilteredSvcs(){
  const drvF=document.getElementById('rpt-driver').value, p=document.getElementById('rpt-period').value, now=new Date();let from,to;
  if(p==='today'){from=to=TODAY;}else if(p==='week'){
      const d=new Date(now);d.setDate(d.getDate()-d.getDay());
      from=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      to=TODAY;
  }else if(p==='month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';to=TODAY;}
  else{from=document.getElementById('rpt-from').value;to=document.getElementById('rpt-to').value;}
  return ST.services.filter(s=>{const d=s.serviceDate||TODAY;return d>=from&&d<=to&&(!drvF||s.driver===drvF);});
}

export function genReport(){
  const svcs=getFilteredSvcs(), drv=document.getElementById('rpt-driver').value;
  const total=svcs.length, ent=svcs.filter(s=>s.type==='entrega').length, ret=svcs.filter(s=>s.type==='retirada').length;
  const tro=svcs.filter(s=>s.type==='troca').length, done=svcs.filter(s=>s.done).length, pend=total-done;
  const totalC=svcs.reduce((a,s)=>a+(s.cacambas||[]).length,0);
  const pct=total>0?Math.round(done/total*100):0;

  let html=`<div class="rpt-section"><div class="rpt-sech">📊 Relatório</div><div style="padding:11px 13px"><div class="stats-grid"><div class="stat-card"><div class="stat-label">Serviços</div><div class="stat-val">${total}</div></div><div class="stat-card"><div class="stat-label">Caçambas</div><div class="stat-val">${totalC}</div></div><div class="stat-card"><div class="stat-label">Feitos</div><div class="stat-val ok">${done}</div></div><div class="stat-card"><div class="stat-label">Pendentes</div><div class="stat-val pend">${pend}</div></div></div></div></div>`;
  document.getElementById('rpt-out').innerHTML=html;
  document.getElementById('exp-row').style.display=svcs.length?'flex':'none';
  window._rptSvcs=svcs;
}

export function exportPDF(){/* Código de PDF omitido por brevidade */}
export function exportCSV(){/* Código de CSV omitido por brevidade */}

// CAÇAMBAS
export function registerSingleCab(){
    const inp=document.getElementById('cab-reg-num');
    const num = inp.value.trim();
    if(!num||ST.cacambas.some(c=>c.num===num)) return;
    ST.cacambas.push({num, createdAt: new Date().toISOString()});
    save(); inp.value=''; renderCabList();
}
export function registerBatchCabs(){/* Código de Lote */}
export function removeCab(num){if(confirm('Remover?')){ST.cacambas=ST.cacambas.filter(c=>c.num!==num);save();renderCabList();}}
export function toggleCabHistory(num){const el=document.getElementById('cab-hist-'+num.replace(/[^a-zA-Z0-9_-]/g,'_'));if(el)el.style.display=el.style.display==='none'?'block':'none';}
export function renderCabList(){
  const list=document.getElementById('cab-list'); if(!list)return;
  list.innerHTML='';
  ST.cacambas.forEach(c=>{
    const row=document.createElement('div'); row.className='admin-list-item';
    row.innerHTML=`<div style="flex:1">🟫 ${c.num}</div><button class="btn-delete" data-action="remove-cab" data-num="${c.num}">🗑</button>`;
    list.appendChild(row);
  });
}
