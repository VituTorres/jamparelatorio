import { ST, AppState, save, TODAY } from '../state.js';
import { dayLabel, showScreen } from '../utils.js';

export function goDriver(name){
  AppState.currentDriverName=name;
  AppState.currentDay=TODAY;
  AppState.currentUser={name,role:'driver'};
  showScreen('s-driver');
  document.getElementById('drv-name-hdr').textContent='👷 '+name;
  document.getElementById('date-picker').value=TODAY;
  renderDriver();
}

export function changeDay(delta){
  const d=new Date(AppState.currentDay+'T12:00:00');
  d.setDate(d.getDate()+delta);
  AppState.currentDay=d.toISOString().split('T')[0];
  document.getElementById('date-picker').value=AppState.currentDay;
  renderDriver();
}

export function setDay(val){
  AppState.currentDay=val;
  renderDriver();
}

export function renderDriver(){
  const lbl=dayLabel(AppState.currentDay);
  document.getElementById('day-label').innerHTML=lbl.main+(lbl.today?'<span class="today-badge">Hoje</span>':'');
  document.getElementById('day-sub').textContent=lbl.sub;
  const svcs=ST.services.filter(s=>s.driver===AppState.currentDriverName&&s.serviceDate===AppState.currentDay);
  const pend=svcs.filter(s=>!s.done).length;
  document.getElementById('drv-sum').textContent=`${pend} pendente${pend!==1?'s':''} de ${svcs.length} neste dia`;
  
  const body=document.getElementById('drv-body');body.innerHTML='';
  const secs=[{k:'entrega',l:'Entregas',i:'📦',c:'entrega'},{k:'retirada',l:'Retiradas',i:'♻️',c:'retirada'},{k:'troca',l:'Trocas',i:'🔄',c:'troca'}];
  
  secs.forEach(sec=>{
    const items=svcs.filter(s=>s.type===sec.k);if(!items.length)return;
    const pn=items.filter(s=>!s.done).length;
    const bl=document.createElement('div');bl.className='task-group';
    bl.innerHTML=`<div class="task-group__header task-group__header--${sec.c}"><span>${sec.i}</span><span class="task-group__title">${sec.l}</span><span class="task-group__count">${pn}/${items.length}</span></div>`;
    
    [...items.filter(s=>!s.done),...items.filter(s=>s.done)].forEach(sv=>{
      const cabs=Array.isArray(sv.cacambas)?sv.cacambas:(sv.num?[sv.num]:[]);
      const expected = sv.qtd || 0; // Quantidade pedida pelo Admin
      
      const it=document.createElement('div');it.className='task-card'+(sv.done?' done':'');
      let cabSection;
      
      if(sv.done){
        const cabHtml=cabs.length?cabs.map(c=>`<span class="cab-tag">🟫 ${c}</span>`).join(''):'<span style="font-size:11px;color:var(--mu)">sem caçamba</span>';
        cabSection=`<div class="cab-row">${cabHtml}</div>`;
      } else {
        const chipsHtml=cabs.map((c,i)=>`<span class="cab-chip">🟫 ${c} <button type="button" data-action="remove-cab-svc" data-id="${sv.id}" data-idx="${i}">×</button></span>`).join('');
        
        let inputRow = '';
        let emptyNote = '';
        
        // Se ainda não atingiu a quantidade ou se é livre (0)
        if (expected === 0 || cabs.length < expected) {
            const remain = expected > 0 ? expected - cabs.length : 0;
            emptyNote = remain > 0 ? `<div class="cab-empty-note">⚠️ Adicione mais ${remain} caçamba(s) para concluir</div>` : '';
            inputRow = `<div class="cab-add-row"><input class="form-control" id="svc-in-${sv.id}" type="text" inputmode="numeric" placeholder="Nº da caçamba" data-action="input-cab-svc" data-id="${sv.id}"><button class="cab-add-btn" type="button" data-action="add-cab-svc" data-id="${sv.id}">+ Caçamba</button></div>`;
        } else {
            emptyNote = `<div class="cab-empty-note" style="color:var(--gr);background:var(--grl)">✓ Quantidade pedida atingida</div>`;
        }
        
        cabSection=`<div class="svc-cab-box"><div class="cab-chips">${chipsHtml}</div>${inputRow}${emptyNote}</div>`;
      }
      
      // Valida se o botão de finalizar pode ser apertado
      const canComplete = sv.done || (expected === 0 ? true : cabs.length >= expected);
      const btnClass = sv.done ? 'task-card__action done' : (canComplete ? 'task-card__action' : 'task-card__action disabled');
      const typeLabel={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[sv.type];
      const cabCount = expected > 0 ? ` · ${cabs.length}/${expected} caçambas` : (cabs.length ? ` · ${cabs.length} caçamba(s)` : ` · 0 caçambas`);
      
      it.innerHTML=`<div class="task-card__info"><div class="task-card__address">${sv.address}</div><div class="task-card__type">${typeLabel}${cabCount}</div>${sv.client?`<div style="font-size:11px;color:var(--mu);margin-top:3px">👤 ${sv.client}</div>`:''}${cabSection}</div><button class="${btnClass}" data-action="toggle-svc" data-id="${sv.id}">✓</button>`;
      bl.appendChild(it);
    });
    body.appendChild(bl);
  });
  if(!svcs.length)body.innerHTML='<div class="no-data">Nenhum serviço para este dia.<br><span style="font-size:12px">Use ‹ › para navegar entre os dias.</span></div>';
}

export function addCabToSvc(id){
  const inp=document.getElementById('svc-in-'+id);if(!inp)return;
  const v=inp.value.trim();if(!v)return;
  const sv=ST.services.find(x=>x.id===id);if(!sv)return;
  if(!Array.isArray(sv.cacambas))sv.cacambas=[];
  
  const expected = sv.qtd || 0;
  if(expected > 0 && sv.cacambas.length >= expected){
      alert('Quantidade máxima pedida ('+expected+') atingida para este serviço.');
      return;
  }
  
  if(sv.cacambas.includes(v)){alert('Caçamba '+v+' já adicionada neste serviço.');return;}

  // TRAVA: Só aceita caçambas que existam no cadastro do Administrador
  const existeNoSistema = ST.cacambas.some(c => c.num === v);
  if (!existeNoSistema) {
    alert('❌ Erro: A caçamba nº ' + v + ' não existe no sistema. Verifique o número digitado ou contate o Administrador.');
    return;
  }

  sv.cacambas.push(v);
  save();renderDriver();
}

export function removeCabFromSvc(id,idx){
  const sv=ST.services.find(x=>x.id===id);if(!sv||!Array.isArray(sv.cacambas))return;
  sv.cacambas.splice(idx,1);
  save();renderDriver();
}

export function toggle(id){
  const s=ST.services.find(x=>x.id===id);if(!s)return;
  if(!s.done){
    const cabs=Array.isArray(s.cacambas)?s.cacambas:[];
    const expected = s.qtd || 0;
    
    // Bloqueia a conclusão se não tiver adicionado todas as caçambas pedidas
    if(expected > 0 && cabs.length < expected){
        alert(`Adicione as ${expected} caçamba(s) antes de concluir o serviço.`);
        return;
    }
  }
  s.done=!s.done;save();renderDriver();
}