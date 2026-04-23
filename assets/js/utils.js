import { TODAY } from './state.js';

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

export function _escHtml(s) {
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function dayLabel(ds) {
  const d = new Date(ds+'T12:00:00'), diff = Math.round((d-new Date(TODAY+'T12:00:00'))/(864e5));
  const wd = d.toLocaleDateString('pt-BR',{weekday:'long'}), dm = d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'});
  const main = diff===0 ? (wd.charAt(0).toUpperCase()+wd.slice(1)) : diff===-1 ? 'Ontem' : diff===1 ? 'Amanhã' : (wd.charAt(0).toUpperCase()+wd.slice(1));
  return {main, sub:dm, today:diff===0};
}

// NOVO: Função para criar um Hash SHA-256 da senha
export async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}