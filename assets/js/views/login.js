import { ST, AppState, TODAY } from '../state.js';
import { showScreen, hashPassword } from '../utils.js';
import { goAdmin } from './admin.js';
import { goDriver } from './driver.js';

function _resetPwModal(){
  document.getElementById('pw-input').value='';
  document.getElementById('pw-err').textContent='';
  document.getElementById('pw-input').classList.remove('error');
  document.getElementById('pw-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('pw-input').focus(),100);
}

export function openPwModal(){
  AppState.pwModalTarget={type:'admin'};
  document.getElementById('pw-modal-title').textContent='🔐 Acesso Administrativo';
  document.getElementById('pw-modal-sub').textContent='Digite a senha para continuar';
  _resetPwModal();
}

export function openDriverPwModal(name){
  AppState.pwModalTarget={type:'driver',name};
  document.getElementById('pw-modal-title').textContent='👷 '+name;
  document.getElementById('pw-modal-sub').textContent='Digite sua senha para entrar';
  _resetPwModal();
}

export function closePwModal(){
  AppState.pwModalTarget=null;
  document.getElementById('pw-modal').classList.add('hidden');
}

export async function checkPw(){
  const val = document.getElementById('pw-input').value;
  const hashedVal = await hashPassword(val); // HASH DA SENHA DIGITADA
  
  let ok=false;
  if(AppState.pwModalTarget && AppState.pwModalTarget.type==='admin'){
    ok=(hashedVal===ST.adminPw);
  } else if(AppState.pwModalTarget && AppState.pwModalTarget.type==='driver'){
    const d=ST.drivers.find(x=>x.name===AppState.pwModalTarget.name);
    ok=!!(d && d.password===hashedVal);
  }
  
  if(ok){
    const target=AppState.pwModalTarget;
    closePwModal();
    if(target.type==='admin'){
      AppState.currentUser={name:'Administrador',role:'admin'};
      goAdmin();
    } else {
      goDriver(target.name);
    }
  } else {
    document.getElementById('pw-err').textContent='Senha incorreta. Tente novamente.';
    document.getElementById('pw-input').classList.add('error');
    document.getElementById('pw-input').value='';
    document.getElementById('pw-input').focus();
    setTimeout(()=>{document.getElementById('pw-input').classList.remove('error');document.getElementById('pw-err').textContent='';},2000);
  }
}

export function renderLogin(){
  const d=new Date();
  document.getElementById('login-date').textContent=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const list=document.getElementById('login-driver-list');
  list.innerHTML='';
  ST.drivers.forEach(drv=>{
    const name=drv.name;
    const pend=ST.services.filter(s=>s.driver===name&&!s.done&&s.serviceDate===TODAY).length;
    const init=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const btn=document.createElement('button');btn.className='driver-btn';
    btn.innerHTML=`<div class="avatar driver">${init}</div><span>${name}</span><span class="badge-count">${pend} pendente${pend!==1?'s':''} hoje</span>`;
    btn.addEventListener('click', () => openDriverPwModal(name));
    list.appendChild(btn);
  });
}

export function logout(){
  AppState.currentUser=null;
  AppState.currentDriverName='';
  showScreen('s-login');
  renderLogin();
}