const TODAY = new Date().toISOString().split('T')[0];

let ST = JSON.parse(localStorage.getItem('cacamba_v4')||'null') || {
  drivers: [
    {name:'Carlos',password:'1234'},
    {name:'Marcos',password:'1234'},
    {name:'Rafael',password:'1234'},
    {name:'Leandro',password:'1234'}
  ],
  services: [],
  adminPw: '1234'
};
function save(){localStorage.setItem('cacamba_v4',JSON.stringify(ST))}
if(Array.isArray(ST.drivers)){
  ST.drivers = ST.drivers.map(d => typeof d === 'string' ? {name:d, password:'1234'} : {name:d.name, password:(d.password&&d.password.length>=3)?d.password:'1234'});
}
if(!Array.isArray(ST.cacambas)) ST.cacambas = [];
save();

let currentDriverName = '';
let currentDay = TODAY;
let currentUser = null;
let pwModalTarget = null;

if(!ST.services.length){
  const types=['entrega','retirada','troca'];
  const addrs=['Rua das Flores, 123','Av. Brasil, 456','Rua 7 de Setembro, 89','Rua Ipiranga, 320','Av. Paulista, 1000','Rua Augusta, 55','Rua Consolação, 210'];
  const cabSets=[['42'],['101','102'],['55'],['78','79','80'],['91'],['07','08'],['43','44','45']];
  for(let i=0;i<8;i++){
    ST.services.push({id:'d'+i,client:'',address:addrs[i%addrs.length],type:types[i%3],cacambas:cabSets[i%cabSets.length],driver:ST.drivers[i%ST.drivers.length].name,done:i<2,serviceDate:TODAY});
  }
  const yd=new Date();yd.setDate(yd.getDate()-1);const yday=yd.toISOString().split('T')[0];
  ST.services.push({id:'dp1',client:'',address:'Rua Ontem, 999',type:'retirada',cacambas:['55','56'],driver:ST.drivers[0].name,done:true,serviceDate:yday});
  save();
}

// ── MODAL ──
function _resetPwModal(){
  document.getElementById('pw-input').value='';
  document.getElementById('pw-err').textContent='';
  document.getElementById('pw-input').classList.remove('error');
  document.getElementById('pw-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('pw-input').focus(),100);
}
function openPwModal(){
  pwModalTarget={type:'admin'};
  document.getElementById('pw-modal-title').textContent='🔐 Acesso Administrativo';
  document.getElementById('pw-modal-sub').textContent='Digite a senha para continuar';
  _resetPwModal();
}
function openDriverPwModal(name){
  pwModalTarget={type:'driver',name};
  document.getElementById('pw-modal-title').textContent='👷 '+name;
  document.getElementById('pw-modal-sub').textContent='Digite sua senha para entrar';
  _resetPwModal();
}
function closePwModal(){pwModalTarget=null;document.getElementById('pw-modal').classList.add('hidden');}
function checkPw(){
  const val=document.getElementById('pw-input').value;
  let ok=false;
  if(pwModalTarget&&pwModalTarget.type==='admin') ok=(val===ST.adminPw);
  else if(pwModalTarget&&pwModalTarget.type==='driver'){
    const d=ST.drivers.find(x=>x.name===pwModalTarget.name);
    ok=!!(d && d.password===val);
  }
  if(ok){
    const target=pwModalTarget; closePwModal();
    if(target.type==='admin'){currentUser={name:'Administrador',role:'admin'};goAdmin();}
    else goDriver(target.name);
  } else {
    document.getElementById('pw-err').textContent='Senha incorreta. Tente novamente.';
    document.getElementById('pw-input').classList.add('error');
    document.getElementById('pw-input').value='';
    document.getElementById('pw-input').focus();
    setTimeout(()=>{document.getElementById('pw-input').classList.remove('error');document.getElementById('pw-err').textContent='';},2000);
  }
}

// ── NAV ──
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}
function logout(){currentUser=null;currentDriverName='';showScreen('s-login');renderLogin();}

function goAdmin(){
  showScreen('s-admin');
  renderAdminDriverSelect();
  document.getElementById('f-date').value=TODAY;
  document.getElementById('filter-date').value='';
  renderAdminList();
  renderRptFilters();
}

function goDriver(name){
  currentDriverName=name; currentDay=TODAY;
  currentUser={name,role:'driver'};
  showScreen('s-driver');
  document.getElementById('drv-name-hdr').textContent='👷 '+name;
  document.getElementById('date-picker').value=TODAY;
  renderDriver();
}

function stab(id,idx){
  document.querySelectorAll('.tc').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tab')[idx].classList.add('active');
  if(id==='t-list')renderAdminList();
  if(id==='t-drv')renderDrvAdmin();
  if(id==='t-cab')renderCabList();
  if(id==='t-rpt'){renderRptFilters();document.getElementById('rpt-out').innerHTML='';document.getElementById('exp-row').style.display='none';}
}

// ── LOGIN ──
function renderLogin(){
  const d=new Date();
  document.getElementById('login-date').textContent=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const list=document.getElementById('login-driver-list');list.innerHTML='';
  ST.drivers.forEach(drv=>{
    const name=drv.name;
    const pend=ST.services.filter(s=>s.driver===name&&!s.done&&s.serviceDate===TODAY).length;
    const init=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const btn=document.createElement('button');btn.className='driver-btn';
    btn.innerHTML=`<div class="dav driver">${init}</div><span>${name}</span><span class="dcnt">${pend} pendente${pend!==1?'s':''} hoje</span>`;
    btn.onclick=()=>openDriverPwModal(name);
    list.appendChild(btn);
  });
}

// ── DAY NAV ──
function changeDay(delta){const d=new Date(currentDay+'T12:00:00');d.setDate(d.getDate()+delta);currentDay=d.toISOString().split('T')[0];document.getElementById('date-picker').value=currentDay;renderDriver();}
function setDay(val){currentDay=val;renderDriver();}
function dayLabel(ds){
  const d=new Date(ds+'T12:00:00'),diff=Math.round((d-new Date(TODAY+'T12:00:00'))/(864e5));
  const wd=d.toLocaleDateString('pt-BR',{weekday:'long'}),dm=d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'});
  const main=diff===0?(wd.charAt(0).toUpperCase()+wd.slice(1)):diff===-1?'Ontem':diff===1?'Amanhã':(wd.charAt(0).toUpperCase()+wd.slice(1));
  return{main,sub:dm,today:diff===0};
}

// ── VALIDAÇÃO COMPLETA DE CAÇAMBA ──
function validateCabForService(cabNum, serviceId, slotIndex){
  const num = normalizeCabNum(cabNum);
  if(!num) return {ok:false, msg:'Informe um número válido.'};

  // 1. Existência no cadastro
  if(!ST.cacambas.some(c => c.num === num)){
    return {ok:false, msg:'Caçamba ' + num + ' não cadastrada. Cadastre-a em Admin → Caçambas antes de usar.'};
  }

  // 2. Unicidade dentro do mesmo serviço (outros slots)
  const sv = ST.services.find(s => s.id === serviceId);
  if(sv){
    const duplicate = (sv.cacambas||[]).some((c,i)=> i !== slotIndex && c === num);
    if(duplicate) return {ok:false, msg:'Caçamba ' + num + ' já foi adicionada neste serviço.'};
  }

  // 3. Vinculada a outro serviço ativo (pendente)
  const activeConflict = ST.services.find(s =>
    s.id !== serviceId && !s.done && (s.cacambas||[]).includes(num)
  );
  if(activeConflict){
    return {ok:false, msg:'Caçamba ' + num + ' já está vinculada a um serviço ativo em: ' + activeConflict.address + '.'};
  }

  // 4. Status de ocupação (entregue e não retirada ainda)
  const status = getCabStatus(num);
  if(status.status === 'Em uso'){
    return {ok:false, msg:'Esta caçamba já está em uso em outro endereço. Realize a retirada antes de reutilizá-la.'};
  }

  return {ok:true, num};
}

// ── DRIVER SCREEN ──
function renderDriver(){
  const lbl=dayLabel(currentDay);
  document.getElementById('day-label').innerHTML=lbl.main+(lbl.today?'<span class="today-badge">Hoje</span>':'');
  document.getElementById('day-sub').textContent=lbl.sub;
  const svcs=ST.services.filter(s=>s.driver===currentDriverName&&s.serviceDate===currentDay);
  const pend=svcs.filter(s=>!s.done).length;
  document.getElementById('drv-sum').textContent=`${pend} pendente${pend!==1?'s':''} de ${svcs.length} neste dia`;
  const body=document.getElementById('drv-body');body.innerHTML='';
  const secs=[{k:'entrega',l:'Entregas',i:'📦',c:'e'},{k:'retirada',l:'Retiradas',i:'♻️',c:'r'},{k:'troca',l:'Trocas',i:'🔄',c:'t'}];
  secs.forEach(sec=>{
    const items=svcs.filter(s=>s.type===sec.k);if(!items.length)return;
    const pn=items.filter(s=>!s.done).length;
    const bl=document.createElement('div');bl.className='sec';
    bl.innerHTML=`<div class="sech sech-${sec.c}"><span>${sec.i}</span><span class="sect">${sec.l}</span><span class="secb">${pn}/${items.length}</span></div>`;
    [...items.filter(s=>!s.done),...items.filter(s=>s.done)].forEach(sv=>{
      const cabs=Array.isArray(sv.cacambas)?sv.cacambas:(sv.num?[sv.num]:[]);
      const filledCabs=cabs.filter(c=>c);
      const it=document.createElement('div');it.className='svi'+(sv.done?' done':'');
      const sid=_escHtml(sv.id);

      let cabSection;
      if(sv.done){
        const cabHtml=filledCabs.length
          ?filledCabs.map(c=>`<span class="cab-tag">🟫 ${_escHtml(c)}</span>`).join('')
          :'<span style="font-size:11px;color:var(--mu)">sem caçamba</span>';
        cabSection=`<div class="cab-row">${cabHtml}</div>`;
      } else {
        // Slots numerados — motorista preenche o número de cada caçamba
        const slotsHtml=cabs.map((c,i)=>{
          if(c){
            return `<div class="cab-slot"><span class="cab-slot-label">Caçamba ${i+1}</span><span class="cab-chip">🟫 ${_escHtml(c)} <button type="button" onclick="clearCabSlot('${sid}',${i})">×</button></span></div>`;
          }
          return `<div class="cab-slot"><span class="cab-slot-label">Caçamba ${i+1}</span><div class="cab-slot-input"><input class="cnin" id="svc-slot-${sid}-${i}" type="text" inputmode="numeric" placeholder="Nº da caçamba" onkeydown="if(event.key==='Enter'){event.preventDefault();fillCabSlot('${sid}',${i})}"><button class="cab-add-btn" type="button" onclick="fillCabSlot('${sid}',${i})">✓</button></div><div class="slot-err" id="svc-slot-err-${sid}-${i}"></div></div>`;
        }).join('');
        const pendingCount=cabs.filter(c=>!c).length;
        const pendingNote=pendingCount>0
          ?`<div class="cab-empty-note">⚠️ ${pendingCount} caçamba${pendingCount!==1?'s':''} pendente${pendingCount!==1?'s':''} de preenchimento</div>`
          :'';
        cabSection=`<div class="svc-cab-box">${slotsHtml}${pendingNote}</div>`;
      }

      const allFilled=sv.done||(cabs.length>0&&cabs.every(c=>c));
      const btnClass=sv.done?'okb done':(allFilled?'okb':'okb disabled');
      const typeLabel={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[sv.type];
      const cabCount=` · ${cabs.length} caçamba${cabs.length!==1?'s':''}`;

      it.innerHTML=`<div class="svi-info"><div class="svi-addr">${_escHtml(sv.address)}</div><div class="svi-type">${typeLabel}${cabCount}</div>${sv.client?`<div style="font-size:11px;color:var(--mu);margin-top:3px">👤 ${_escHtml(sv.client)}</div>`:''}${cabSection}</div><button class="${btnClass}" onclick="toggle('${sid}')">✓</button>`;
      bl.appendChild(it);
    });
    body.appendChild(bl);
  });
  if(!svcs.length)body.innerHTML='<div class="no-data">Nenhum serviço para este dia.<br><span style="font-size:12px">Use ‹ › para navegar entre os dias.</span></div>';
}

function fillCabSlot(serviceId, slotIndex){
  const inp=document.getElementById('svc-slot-'+serviceId+'-'+slotIndex);
  if(!inp)return;
  const v=inp.value.trim();if(!v)return;
  const sv=ST.services.find(x=>x.id===serviceId);if(!sv)return;
  if(!Array.isArray(sv.cacambas))sv.cacambas=[];

  const validation=validateCabForService(v, serviceId, slotIndex);
  if(!validation.ok){
    const errEl=document.getElementById('svc-slot-err-'+serviceId+'-'+slotIndex);
    if(errEl){
      errEl.textContent=validation.msg;
      errEl.style.display='block';
      setTimeout(()=>{if(errEl&&errEl.textContent===validation.msg)errEl.style.display='none';},5000);
    } else {
      alert(validation.msg);
    }
    inp.focus();inp.select();
    return;
  }

  sv.cacambas[slotIndex]=validation.num;
  save();renderDriver();
}

function clearCabSlot(serviceId, slotIndex){
  const sv=ST.services.find(x=>x.id===serviceId);if(!sv||!Array.isArray(sv.cacambas))return;
  sv.cacambas[slotIndex]='';
  save();renderDriver();
}

function toggle(id){
  const s=ST.services.find(x=>x.id===id);if(!s)return;
  if(!s.done){
    const cabs=Array.isArray(s.cacambas)?s.cacambas:[];
    if(!cabs.length){alert('Adicione pelo menos uma caçamba antes de concluir.');return;}
    const empty=cabs.filter(c=>!c).length;
    if(empty>0){
      alert('Preencha o número de todas as caçambas antes de concluir.\n('+empty+' caçamba'+(empty!==1?'s':'')+' sem número)');
      return;
    }
  }
  s.done=!s.done;save();renderDriver();
}

// ── ADMIN CRUD ──
function renderAdminDriverSelect(){
  ['f-dr','filter-drv','rpt-driver'].forEach(sid=>{
    const sel=document.getElementById(sid);if(!sel)return;
    const v=sel.value;
    sel.innerHTML=sid==='f-dr'?'<option value="">Selecione...</option>':'<option value="">Todos os motoristas</option>';
    ST.drivers.forEach(d=>{const o=document.createElement('option');o.value=d.name;o.textContent=d.name;sel.appendChild(o);});
    sel.value=v;
  });
}

function renderAdminList(){
  const list=document.getElementById('admin-list');if(!list)return;
  const drvF=document.getElementById('filter-drv').value;
  const dateF=document.getElementById('filter-date').value;
  let svcs=ST.services.filter(s=>(!drvF||s.driver===drvF)&&(!dateF||s.serviceDate===dateF));
  if(!svcs.length){list.innerHTML='<div class="no-data" style="border:none">Nenhum serviço encontrado.</div>';return;}
  list.innerHTML='';
  [...svcs].reverse().forEach(sv=>{
    const lbl={entrega:'📦 Entrega',retirada:'♻️ Retirada',troca:'🔄 Troca'}[sv.type];
    const allCabs=sv.cacambas||[sv.num||'?'];
    const filledCabs=allCabs.filter(c=>c);
    const pendingSlots=allCabs.filter(c=>!c).length;
    const cabHtml=filledCabs.map(c=>`<span class="cab-tag" style="font-size:10px;padding:1px 5px">${_escHtml(c)}</span>`).join('');
    const pendingHtml=pendingSlots>0?`<span class="cab-pending-badge">⏳ ${pendingSlots} pendente${pendingSlots!==1?'s':''}</span>`:'';
    const it=document.createElement('div');it.className='asi';
    it.innerHTML=`<span class="asib ${sv.type}">${lbl}</span><div class="asi-inf"><div class="asi-addr">${_escHtml(sv.address)}</div><div class="asi-meta">${sv.serviceDate} · ${_escHtml(sv.driver)}${sv.client?' · '+_escHtml(sv.client):''}</div><div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">${cabHtml}${pendingHtml}</div></div><span class="as-st ${sv.done?'d':'p'}">${sv.done?'Feito':'Pend.'}</span><button class="del-btn" onclick="delSvc('${sv.id}')">🗑</button>`;
    list.appendChild(it);
  });
}

function renderDrvAdmin(){
  const list=document.getElementById('drv-admin');if(!list)return;list.innerHTML='';
  ST.drivers.forEach((d,i)=>{
    const r=document.createElement('div');r.className='dr-row';
    r.style.flexWrap='wrap'; r.style.gap='6px';
    const nameSafe=(d.name||'').replace(/"/g,'&quot;');
    const pwSafe=(d.password||'').replace(/"/g,'&quot;');
    r.innerHTML=`
      <div style="display:flex;gap:7px;width:100%;align-items:center">
        <input class="dr-inp" placeholder="Nome" value="${nameSafe}" onchange="updateDriverName(${i},this.value)" style="flex:1">
        <button class="rm-btn" onclick="rmDrv(${i})">✕</button>
      </div>
      <input class="dr-inp" type="password" placeholder="Senha (mín. 3)" value="${pwSafe}" autocomplete="new-password" onchange="updateDriverPassword(${i},this.value)" style="width:100%">
    `;
    list.appendChild(r);
  });
}
function updateDriverName(i,v){
  const nv=(v||'').trim();
  if(!nv){alert('O nome não pode ficar vazio.');renderDrvAdmin();return;}
  const old=ST.drivers[i].name;
  if(old===nv)return;
  if(ST.drivers.some((x,j)=>j!==i&&x.name===nv)){alert('Já existe um motorista com esse nome.');renderDrvAdmin();return;}
  ST.drivers[i].name=nv;
  ST.services.forEach(s=>{if(s.driver===old)s.driver=nv;});
  save();renderAdminDriverSelect();renderAdminList();renderLogin();
}
function updateDriverPassword(i,v){
  const nv=(v||'').trim();
  if(!nv||nv.length<3){alert('A senha deve ter no mínimo 3 caracteres.');renderDrvAdmin();return;}
  ST.drivers[i].password=nv;save();
}

function addService(){
  const date=document.getElementById('f-date').value;
  const cl=document.getElementById('f-cl').value.trim();
  const ad=document.getElementById('f-ad').value.trim();
  const tp=document.getElementById('f-tp').value;
  const dr=document.getElementById('f-dr').value;
  const qtyEl=document.getElementById('f-cab-qty');
  const qty=Math.max(1,Math.min(20,parseInt(qtyEl.value,10)||1));

  if(!date||!ad||!tp||!dr){alert('Preencha: Data, Endereço, Tipo e Motorista.');return;}

  // Gera slots vazios — motorista preencherá os números
  const emptySlots=Array(qty).fill('');
  ST.services.push({id:Date.now().toString(),client:cl,address:ad,type:tp,cacambas:emptySlots,driver:dr,done:false,serviceDate:date});
  save();

  ['f-cl','f-ad'].forEach(id=>document.getElementById(id).value='');
  ['f-tp','f-dr'].forEach(id=>document.getElementById(id).value='');
  qtyEl.value='';

  const btn=document.getElementById('sub-btn');
  btn.textContent='✓ Cadastrado! ('+qty+' caçamba'+(qty!==1?'s':(qty===1?'':'s'))+')';
  btn.style.background='var(--gr)';
  setTimeout(()=>{btn.textContent='Cadastrar Serviço';btn.style.background='';},2000);
}

function delSvc(id){if(!confirm('Remover serviço?'))return;ST.services=ST.services.filter(s=>s.id!==id);save();renderAdminList();}
function addDriver(){
  const nIn=document.getElementById('nd-inp');
  const pIn=document.getElementById('nd-pw-inp');
  const n=(nIn.value||'').trim();
  const pw=(pIn.value||'').trim();
  if(!n){alert('Digite o nome do motorista.');return;}
  if(!pw||pw.length<3){alert('A senha deve ter no mínimo 3 caracteres.');return;}
  if(ST.drivers.some(x=>x.name===n)){alert('Já existe um motorista com esse nome.');return;}
  ST.drivers.push({name:n,password:pw});save();
  nIn.value='';pIn.value='';
  renderDrvAdmin();renderAdminDriverSelect();renderLogin();
}
function rmDrv(i){if(!confirm('Remover '+ST.drivers[i].name+'?'))return;ST.drivers.splice(i,1);save();renderDrvAdmin();renderAdminDriverSelect();renderLogin();}

// ── CHANGE PASSWORD ──
function changePw(){
  const cur=document.getElementById('pw-cur').value;
  const nw=document.getElementById('pw-new').value;
  const nw2=document.getElementById('pw-new2').value;
  const msg=document.getElementById('pw-msg');
  if(cur!==ST.adminPw){msg.style.color='var(--re)';msg.textContent='Senha atual incorreta.';return;}
  if(!nw||nw.length<3){msg.style.color='var(--re)';msg.textContent='Nova senha muito curta (mínimo 3 caracteres).';return;}
  if(nw!==nw2){msg.style.color='var(--re)';msg.textContent='As senhas não conferem.';return;}
  ST.adminPw=nw;save();
  ['pw-cur','pw-new','pw-new2'].forEach(id=>document.getElementById(id).value='');
  msg.style.color='var(--gr)';msg.textContent='✓ Senha alterada com sucesso!';
  setTimeout(()=>msg.textContent='',3000);
}

// ── REPORTS ──
document.getElementById('rpt-period').addEventListener('change',function(){document.getElementById('custom-dates').style.display=this.value==='custom'?'flex':'none';});
function renderRptFilters(){
  renderAdminDriverSelect();
  document.getElementById('rpt-from').value=TODAY;document.getElementById('rpt-to').value=TODAY;
}
function getFilteredSvcs(){
  const drvF=document.getElementById('rpt-driver').value;
  const p=document.getElementById('rpt-period').value;
  const now=new Date();let from,to;
  if(p==='today'){from=to=TODAY;}
  else if(p==='week'){const d=new Date(now);d.setDate(d.getDate()-d.getDay());from=d.toISOString().split('T')[0];to=TODAY;}
  else if(p==='month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';to=TODAY;}
  else{from=document.getElementById('rpt-from').value;to=document.getElementById('rpt-to').value;}
  return ST.services.filter(s=>{const d=s.serviceDate||TODAY;return d>=from&&d<=to&&(!drvF||s.driver===drvF);});
}
function periodLabel(){const p=document.getElementById('rpt-period').value,now=new Date();if(p==='today')return now.toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'});if(p==='week')return'Esta semana';if(p==='month')return now.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return document.getElementById('rpt-from').value+' → '+document.getElementById('rpt-to').value;}
function genReport(){
  const svcs=getFilteredSvcs(),drv=document.getElementById('rpt-driver').value;
  const total=svcs.length,ent=svcs.filter(s=>s.type==='entrega').length,ret=svcs.filter(s=>s.type==='retirada').length;
  const tro=svcs.filter(s=>s.type==='troca').length,done=svcs.filter(s=>s.done).length,pend=total-done;
  const pct=total>0?Math.round(done/total*100):0;
  const totalC=svcs.reduce((a,s)=>a+((s.cacambas||[]).filter(c=>c)).length,0);
  let html=`<div class="rpt-section"><div class="rpt-sech">📊 ${periodLabel()}${drv?' · '+drv:''}</div><div style="padding:11px 13px"><div class="stats-grid"><div class="stat-card"><div class="stat-label">Serviços</div><div class="stat-val">${total}</div></div><div class="stat-card"><div class="stat-label">Caçambas</div><div class="stat-val">${totalC}</div></div><div class="stat-card"><div class="stat-label">Concluídos</div><div class="stat-val ok">${done}</div></div><div class="stat-card"><div class="stat-label">Pendentes</div><div class="stat-val pend">${pend}</div></div></div><div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap"><span style="background:var(--bll);color:var(--bld);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600">📦 ${ent}</span><span style="background:var(--grl);color:var(--grd);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600">♻️ ${ret}</span><span style="background:var(--aml);color:var(--amd);border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600">🔄 ${tro}</span></div><div style="margin-top:9px"><div style="font-size:11px;color:var(--mu);margin-bottom:4px">Conclusão: ${pct}%</div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></div></div></div>`;
  if(!drv&&ST.drivers.length>1){html+=`<div class="rpt-section"><div class="rpt-sech">👷 Por Motorista</div>`;ST.drivers.forEach(drv2=>{const ds=svcs.filter(s=>s.driver===drv2.name);if(!ds.length)return;const dd=ds.filter(s=>s.done).length,dp=Math.round(dd/ds.length*100),dc=ds.reduce((a,s)=>a+((s.cacambas||[]).filter(c=>c)).length,0);html+=`<div class="bdc-row"><div style="flex:1"><div style="font-size:13px;font-weight:600">${drv2.name}</div><div style="font-size:11px;color:var(--mu)">${ds.length} serviço${ds.length!==1?'s':''} · ${dc} caçamba${dc!==1?'s':''} · ${dd} feito${dd!==1?'s':''}</div><div class="progress-bar"><div class="progress-fill" style="width:${dp}%"></div></div></div><span class="rpt-st done" style="margin-left:8px">${dp}%</span></div>`;});html+=`</div>`;}
  if(svcs.length){html+=`<div class="rpt-section"><div class="rpt-sech">📋 Lista Detalhada</div>`;[...svcs.filter(s=>!s.done),...svcs.filter(s=>s.done)].forEach(s=>{const lbl={entrega:'📦 Entrega',retirada:'♻️ Retirada',troca:'🔄 Troca'}[s.type];const cabs=(s.cacambas||[s.num||'?']).filter(c=>c);const cabHtml=cabs.map(c=>`<span class="cab-tag" style="font-size:10px;padding:1px 5px">${_escHtml(c)}</span>`).join('');html+=`<div class="rpt-row"><span class="asib ${s.type}">${lbl}</span><div class="rpt-row-info"><div class="rpt-addr">${_escHtml(s.address)}</div><div class="rpt-meta">${s.serviceDate} · ${_escHtml(s.driver)}${s.client?' · '+_escHtml(s.client):''}</div><div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px">${cabHtml}</div></div><span class="rpt-st ${s.done?'done':'pend'}">${s.done?'Concluído':'Pendente'}</span></div>`;});html+=`</div>`;}
  else{html+=`<div class="no-data">Nenhum serviço no período.</div>`;}
  document.getElementById('rpt-out').innerHTML=html;
  document.getElementById('exp-row').style.display=svcs.length?'flex':'none';
  window._rptSvcs=svcs;window._rptLabel=periodLabel();window._rptDrv=drv;
}
function exportPDF(){
  const svcs=window._rptSvcs||[],lbl=window._rptLabel||'',drv=window._rptDrv||'';
  const done=svcs.filter(s=>s.done).length,pct=svcs.length?Math.round(done/svcs.length*100):0;
  const ent=svcs.filter(s=>s.type==='entrega').length,ret=svcs.filter(s=>s.type==='retirada').length,tro=svcs.filter(s=>s.type==='troca').length;
  const totalC=svcs.reduce((a,s)=>a+((s.cacambas||[]).filter(c=>c)).length,0);
  const rows=svcs.map(s=>{const t={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[s.type];const cabs=((s.cacambas||[s.num||'?']).filter(c=>c)).join(', ');return`<tr style="border-bottom:1px solid #e5e3dc"><td style="padding:6px 8px;font-size:12px">${s.serviceDate}</td><td style="padding:6px 8px;font-size:12px">${s.address}</td><td style="padding:6px 8px;font-size:12px">${t}</td><td style="padding:6px 8px;font-size:12px">${cabs}</td><td style="padding:6px 8px;font-size:12px">${s.driver}</td><td style="padding:6px 8px;font-size:12px;font-weight:600;color:${s.done?'#1B5E20':'#A32D2D'}">${s.done?'Concluído':'Pendente'}</td></tr>`;}).join('');
  const w=window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#1a1917}h1{color:#2E7D32;font-size:18px;margin-bottom:3px}.sub{color:#6b6963;font-size:12px;margin-bottom:20px}.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.sc{border:1px solid #e2e0d8;border-radius:7px;padding:10px}.sl{font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}.sv{font-size:20px;font-weight:700}table{width:100%;border-collapse:collapse}th{background:#F8F7F4;padding:7px 8px;font-size:10px;text-align:left;border-bottom:2px solid #e2e0d8;color:#6b6963;text-transform:uppercase}@media print{body{padding:14px}}</style></head><body><h1>Jampa Caçambas — Relatório</h1><div class="sub">${lbl}${drv?' · '+drv:''} · Gerado em ${new Date().toLocaleString('pt-BR')}</div><div class="sg"><div class="sc"><div class="sl">Serviços</div><div class="sv">${svcs.length}</div></div><div class="sc"><div class="sl">Caçambas</div><div class="sv">${totalC}</div></div><div class="sc"><div class="sl">Concluídos</div><div class="sv" style="color:#1B5E20">${done}</div></div><div class="sc"><div class="sl">Taxa</div><div class="sv">${pct}%</div></div></div><p style="font-size:11px;color:#6b6963;margin-bottom:14px">📦 ${ent} Entregas &nbsp;♻️ ${ret} Retiradas &nbsp;🔄 ${tro} Trocas</p><table><thead><tr><th>Data</th><th>Endereço</th><th>Tipo</th><th>Caçambas</th><th>Motorista</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>`);
  w.document.close();
}
function exportCSV(){
  const svcs=window._rptSvcs||[],lbl=(window._rptLabel||'relatorio').replace(/[^a-zA-Z0-9]/g,'_');
  const rows=[['Data','Endereço','Tipo','Caçambas','Qtd','Motorista','Cliente','Status']];
  svcs.forEach(s=>{const t={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[s.type];const cabs=(s.cacambas||[s.num||'?']).filter(c=>c);rows.push([s.serviceDate,s.address,t,cabs.join('; '),cabs.length,s.driver,s.client||'',s.done?'Concluído':'Pendente']);});
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`relatorio_${lbl}.csv`;a.click();
}

// ── CAÇAMBAS ──
function normalizeCabNum(v){return String(v==null?'':v).trim();}
function validateCabNum(v){
  const n=normalizeCabNum(v);
  if(!n)return{ok:false,msg:'Informe um número válido.'};
  if(n.length>20)return{ok:false,msg:'Número muito longo (máx. 20 caracteres).'};
  if(!/^[0-9A-Za-z-]+$/.test(n))return{ok:false,msg:'Use apenas letras, números e hífen.'};
  return{ok:true,num:n};
}
function getCabStatus(num){
  const related=ST.services.filter(s=>(s.cacambas||[]).filter(c=>c).includes(num));
  const closed=related.filter(s=>s.done);
  closed.sort((a,b)=>{
    const da=(a.serviceDate||'')+'-'+(a.id||'');
    const db=(b.serviceDate||'')+'-'+(b.id||'');
    return db.localeCompare(da);
  });
  if(!closed.length)return{status:'Disponível',address:null,service:null};
  const latest=closed[0];
  if(latest.type==='entrega'||latest.type==='troca')return{status:'Em uso',address:latest.address,service:latest};
  return{status:'Disponível',address:null,service:null};
}
function getCabHistory(num){
  return ST.services.filter(s=>(s.cacambas||[]).filter(c=>c).includes(num)).slice().sort((a,b)=>{
    const da=(a.serviceDate||'')+'-'+(a.id||'');
    const db=(b.serviceDate||'')+'-'+(b.id||'');
    return db.localeCompare(da);
  });
}
function _setCabMsg(id,txt,ok){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=txt||'';
  el.style.color=ok?'var(--gr)':'var(--re)';
  if(txt)setTimeout(()=>{if(el.textContent===txt)el.textContent='';},3500);
}
function registerSingleCab(){
  const inp=document.getElementById('cab-reg-num');
  const res=validateCabNum(inp.value);
  if(!res.ok){_setCabMsg('cab-reg-msg',res.msg,false);return;}
  if(ST.cacambas.some(c=>c.num===res.num)){_setCabMsg('cab-reg-msg','Caçamba nº '+res.num+' já está cadastrada.',false);return;}
  ST.cacambas.push({num:res.num,createdAt:new Date().toISOString()});
  save(); inp.value='';inp.focus();
  _setCabMsg('cab-reg-msg','✓ Caçamba nº '+res.num+' cadastrada.',true);
  renderCabList();
}
function registerBatchCabs(){
  const fromEl=document.getElementById('cab-batch-from');
  const toEl=document.getElementById('cab-batch-to');
  const fromV=parseInt(fromEl.value,10);
  const toV=parseInt(toEl.value,10);
  if(!Number.isInteger(fromV)||!Number.isInteger(toV)||fromV<1||toV<1){_setCabMsg('cab-batch-msg','Informe início e fim como números inteiros maiores que zero.',false);return;}
  if(toV<fromV){_setCabMsg('cab-batch-msg','O fim deve ser maior ou igual ao início.',false);return;}
  if(toV-fromV+1>2000){_setCabMsg('cab-batch-msg','Lote muito grande. Máximo de 2000 por vez.',false);return;}
  const existing=new Set(ST.cacambas.map(c=>c.num));
  let added=0,skipped=0;
  const now=new Date().toISOString();
  for(let n=fromV;n<=toV;n++){
    const num=String(n);
    if(existing.has(num)){skipped++;continue;}
    ST.cacambas.push({num,createdAt:now});
    existing.add(num);
    added++;
  }
  save(); fromEl.value='';toEl.value='';
  const parts=['✓ '+added+' cadastrada'+(added!==1?'s':'')];
  if(skipped)parts.push(skipped+' já existente'+(skipped!==1?'s (ignoradas)':' (ignorada)'));
  _setCabMsg('cab-batch-msg',parts.join(' · '),true);
  renderCabList();
}
function removeCab(num){
  const s=getCabStatus(num);
  let warn='Remover cadastro da caçamba nº '+num+'?';
  if(s.status==='Em uso')warn+='\n\n⚠️ Esta caçamba está EM USO em: '+(s.address||'endereço desconhecido');
  if(!confirm(warn))return;
  ST.cacambas=ST.cacambas.filter(c=>c.num!==num);
  save();renderCabList();
}
function toggleCabHistory(num){
  const safe=num.replace(/[^a-zA-Z0-9_-]/g,'_');
  const el=document.getElementById('cab-hist-'+safe);
  if(!el)return;
  el.style.display=el.style.display==='none'?'block':'none';
}
function _escHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function renderCabList(){
  const list=document.getElementById('cab-list');if(!list)return;
  const q=(document.getElementById('cab-search').value||'').trim().toLowerCase();
  const stF=document.getElementById('cab-filter-status').value;
  const total=ST.cacambas.length;
  const emUso=ST.cacambas.filter(c=>getCabStatus(c.num).status==='Em uso').length;
  const disp=total-emUso;
  document.getElementById('cab-count-info').textContent=total?`${total} total · ${disp} disp · ${emUso} em uso`:'';
  const sorted=[...ST.cacambas].sort((a,b)=>{
    const na=parseInt(a.num,10),nb=parseInt(b.num,10);
    if(!isNaN(na)&&!isNaN(nb)&&String(na)===a.num&&String(nb)===b.num)return na-nb;
    return a.num.localeCompare(b.num,undefined,{numeric:true});
  });
  const rows=sorted.filter(c=>{
    if(q&&!c.num.toLowerCase().includes(q))return false;
    if(stF&&getCabStatus(c.num).status!==stF)return false;
    return true;
  });
  if(!total){list.innerHTML='<div class="no-data" style="border:none">Nenhuma caçamba cadastrada ainda. Use o formulário acima para começar.</div>';return;}
  if(!rows.length){list.innerHTML='<div class="no-data" style="border:none">Nenhuma caçamba corresponde aos filtros.</div>';return;}
  list.innerHTML='';
  rows.forEach(c=>{
    const s=getCabStatus(c.num);
    const hist=getCabHistory(c.num);
    const safeId=c.num.replace(/[^a-zA-Z0-9_-]/g,'_');
    const numAttr=_escHtml(c.num);
    const stClass=s.status==='Em uso'?'p':'d';
    const addrLine=s.address?('📍 '+_escHtml(s.address)):'<span style="color:var(--mu)">— sem alocação</span>';
    const histHtml=hist.map(h=>{
      const lbl={entrega:'📦 Entrega',retirada:'♻️ Retirada',troca:'🔄 Troca'}[h.type]||h.type;
      const st=h.done?'<span style="color:var(--grd);font-weight:700">✓ concluído</span>':'<span style="color:var(--re);font-weight:700">⏳ pendente</span>';
      return `<div style="font-size:11px;padding:4px 0;border-bottom:.5px dashed var(--br)"><strong>${_escHtml(h.serviceDate||'')}</strong> · ${lbl} · ${_escHtml(h.address||'')} · ${_escHtml(h.driver||'')} · ${st}</div>`;
    }).join('')||'<div style="font-size:11px;color:var(--mu);padding:4px 0">Sem utilizações registradas.</div>';
    const row=document.createElement('div');
    row.className='asi';row.style.flexWrap='wrap';
    row.innerHTML=`
      <div class="asi-inf" style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:14px;font-weight:700">🟫 ${_escHtml(c.num)}</span>
          <span class="as-st ${stClass}">${s.status}</span>
        </div>
        <div class="asi-meta" style="margin-top:4px">${addrLine}</div>
        <button class="exp-btn" style="margin-top:6px;padding:5px 10px;font-size:11px" onclick="toggleCabHistory('${numAttr}')">📜 Histórico (${hist.length})</button>
        <div id="cab-hist-${safeId}" style="display:none;margin-top:6px;border-left:2px solid var(--br);padding:2px 0 2px 8px">
          ${histHtml}
        </div>
      </div>
      <button class="del-btn" onclick="removeCab('${numAttr}')">🗑</button>
    `;
    list.appendChild(row);
  });
}

renderLogin();
