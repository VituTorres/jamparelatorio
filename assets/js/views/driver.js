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
      const cabs=Array.isArray(sv.cacambas)?sv.cacambas:[];
      const expected = sv.qtd || 0; 
      
      const it=document.createElement('div');it.className='task-card'+(sv.done?' done':'');
      let cabSection;
      
      if(sv.done){
        const cabHtml=cabs.length?cabs.map(c=>`<span class="cab-tag"><img src="assets/images/cacamba.png" style="width:14px;height:auto;margin-right:4px"> ${c}</span>`).join(''):'<span style="font-size:11px;color:var(--mu)">sem caçamba</span>';
        cabSection=`<div class="cab-row">${cabHtml}</div>`;
      } else {
        const chipsHtml=cabs.map((c,i)=>`<span class="cab-chip"><img src="assets/images/cacamba.png" style="width:16px;height:auto;margin-right:4px"> ${c} <button type="button" data-action="remove-cab-svc" data-id="${sv.id}" data-idx="${i}">×</button></span>`).join('');
        
        let inputRow = '';
        let emptyNote = '';
        
        if (expected === 0 || cabs.length < expected) {
            const remain = expected > 0 ? expected - cabs.length : 0;
            emptyNote = remain > 0 ? `<div class="cab-empty-note">⚠️ Adicione mais ${remain} caçamba(s) para concluir</div>` : '';
            inputRow = `<div class="cab-add-row"><input class="form-control" id="svc-in-${sv.id}" type="text" inputmode="numeric" placeholder="Nº da caçamba" data-action="input-cab-svc" data-id="${sv.id}"><button class="cab-add-btn" type="button" data-action="add-cab-svc" data-id="${sv.id}">+ Caçamba</button></div>`;
        } else {
            emptyNote = `<div class="cab-empty-note" style="color:var(--gr);background:var(--grl)">✓ Quantidade pedida atingida</div>`;
        }
        
        cabSection=`<div class="svc-cab-box"><div class="cab-chips">${chipsHtml}</div>${inputRow}${emptyNote}</div>`;
      }
      
      const canComplete = sv.done || (expected === 0 ? true : cabs.length >= expected);
      const btnClass = sv.done ? 'task-card__action completed' : (canComplete ? 'task-card__action pending' : 'task-card__action disabled');
      const typeLabel={entrega:'Entrega',retirada:'Retirada',troca:'Troca'}[sv.type];
      const cabCount = expected > 0 ? ` · ${cabs.length}/${expected} caçambas` : (cabs.length ? ` · ${cabs.length} caçamba(s)` : ` · 0 caçambas`);
      
      it.innerHTML=`<div class="task-card__info"><div class="task-card__address">${sv.address}</div><div class="task-card__type">${typeLabel}${cabCount}</div>${sv.client?`<div style="font-size:11px;color:var(--mu);margin-top:3px">👤 ${sv.client}</div>`:''}${cabSection}</div><button class="${btnClass}" data-action="toggle-svc" data-id="${sv.id}">✓</button>`;
      bl.appendChild(it);
    });
    body.appendChild(bl);
  });
  if(!svcs.length)body.innerHTML='<div class="no-data">Nenhum serviço para este dia.<br><span style="font-size:12px">Use ‹ › para navegar entre os dias.</span></div>';
}

export async function addCabToSvc(id){
  const inp=document.getElementById('svc-in-'+id);if(!inp)return;
  const v=inp.value.trim();if(!v)return;
  const sv=ST.services.find(x=>x.id===id);if(!sv)return;
  if(!Array.isArray(sv.cacambas))sv.cacambas=[];
  
  const expected = sv.qtd || 0;
  if(expected > 0 && sv.cacambas.length >= expected){
      alert('Quantidade máxima pedida ('+expected+') atingida.');
      return;
  }
  
  if(sv.cacambas.includes(v)){alert('Caçamba '+v+' já adicionada.');return;}

  const cabSistema = ST.cacambas.find(c => c.num === v);
  if (!cabSistema) {
    alert('❌ Erro: A caçamba nº ' + v + ' não existe no sistema. Contate o Administrador.');
    return;
  }

  // Validação: Se a caçamba já está em uso, só pode ser adicionada a um serviço de RETIRADA
  if (cabSistema.status === 'Em uso') {
    if (sv.type !== 'retirada') {
      alert(`❌ Erro: A caçamba nº ${v} já está em uso no endereço: ${cabSistema.endereco || 'não informado'}.\n\nSó é possível adicionar caçambas em uso em serviços de RETIRADA.`);
      return;
    }
  }

  const btn = document.querySelector(`button[data-action="add-cab-svc"][data-id="${id}"]`);
  if(btn) {
    btn.disabled = true;
    btn.textContent = "...";
  }

  sv.cacambas.push(v);
  
  // LÓGICA DE STATUS:
  // - Se for ENTREGA: marca como "Em uso"
  // - Se for RETIRADA: apenas vincula (a caçamba já está em uso desde a entrega)
  // - Se for TROCA: marca como "Em uso" (é uma entrega + retirada)
  
  if (sv.type === 'entrega') {
    cabSistema.status = 'Em uso';
    cabSistema.servicoId = sv.id;
    cabSistema.endereco = sv.address;
  } else if (sv.type === 'retirada') {
    // Apenas vincula; a caçamba já está em uso desde a entrega
    cabSistema.retiradaServiceId = sv.id;
  } else if (sv.type === 'troca') {
    // Troca é entrega + retirada, então marca como em uso
    cabSistema.status = 'Em uso';
    cabSistema.servicoId = sv.id;
    cabSistema.endereco = sv.address;
  }

  try {
    await save();
    renderDriver();
  } catch (err) {
    alert("Erro ao salvar no Firebase.");
    if(btn) {
      btn.disabled = false;
      btn.textContent = "+ Caçamba";
    }
  }
}

export async function removeCabFromSvc(id,idx){
  const sv=ST.services.find(x=>x.id===id);if(!sv||!Array.isArray(sv.cacambas))return;
  const num = sv.cacambas[idx];
  
  // Se for RETIRADA ou TROCA, apenas remove o vínculo de retirada
  // A caçamba só fica disponível quando a retirada é marcada como concluída
  
  const cab = ST.cacambas.find(c => c.num === num);
  if (cab) {
    if (sv.type === 'retirada') {
      delete cab.retiradaServiceId;
    } else if (sv.type === 'troca') {
      delete cab.retiradaServiceId;
    }
    // Se for ENTREGA, remove o vínculo e libera a caçamba
    else if (sv.type === 'entrega') {
      delete cab.status;
      delete cab.servicoId;
      delete cab.endereco;
    }
  }

  sv.cacambas.splice(idx,1);
  await save();
  renderDriver();
}

export async function toggle(id){
  const s=ST.services.find(x=>x.id===id);if(!s)return;
  
  if(!s.done){
    const cabs=Array.isArray(s.cacambas)?s.cacambas:[];
    const expected = s.qtd || 0;
    if(expected > 0 && cabs.length < expected){
        alert(`Adicione as ${expected} caçamba(s) antes de concluir.`);
        return;
    }

    // Ao marcar como CONCLUÍDO:
    // - Se for ENTREGA: caçambas continuam "Em uso" (aguardando retirada)
    // - Se for RETIRADA: libera as caçambas (marca como disponível)
    // - Se for TROCA: libera as caçambas (marca como disponível)
    
    if (s.type === 'retirada' || s.type === 'troca') {
      s.cacambas.forEach(num => {
        const cab = ST.cacambas.find(c => c.num === num);
        if (cab) {
          cab.status = 'Disponível'; // Explicitamente marcar como disponível
          delete cab.servicoId;
          delete cab.endereco;
          delete cab.retiradaServiceId;
        }
      });
    }
    // Se for ENTREGA, não faz nada - caçambas continuam em uso
  } else {
    // Se estiver desmarcando como feito:
    // - Se for RETIRADA ou TROCA: marca as caçambas como em uso novamente
    // - Se for ENTREGA: marca como em uso (se não estava)
    
    if (s.type === 'retirada' || s.type === 'troca') {
      s.cacambas.forEach(num => {
        const cab = ST.cacambas.find(c => c.num === num);
        if (cab) {
          cab.status = 'Em uso';
          // Tenta recuperar o endereço da entrega original
          const entrega = ST.services.find(srv => 
            srv.type === 'entrega' && srv.cacambas && srv.cacambas.includes(num)
          );
          if (entrega) {
            cab.servicoId = entrega.id;
            cab.endereco = entrega.address;
          }
        }
      });
    } else if (s.type === 'entrega') {
      s.cacambas.forEach(num => {
        const cab = ST.cacambas.find(c => c.num === num);
        if (cab) {
          cab.status = 'Em uso';
          cab.servicoId = s.id;
          cab.endereco = s.address;
        }
      });
    }
  }

  s.done=!s.done;
  await save();
  renderDriver();
}
