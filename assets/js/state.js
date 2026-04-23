import { StorageService } from './storage.js';
import { hashPassword } from './utils.js';

export const TODAY = new Date().toISOString().split('T')[0];

// Gera o hash da senha padrão (1234)
const defaultPwHash = await hashPassword('1234');

const defaultState = {
  drivers: [
    {name:'Carlos',password:defaultPwHash}, {name:'Marcos',password:defaultPwHash},
    {name:'Rafael',password:defaultPwHash}, {name:'Leandro',password:defaultPwHash}
  ],
  services: [], // Começa 100% vazio
  adminPw: defaultPwHash,
  cacambas: []
};

export let ST = StorageService.getDatabase() || defaultState;

export function save() {
  StorageService.saveDatabase(ST);
}

// Migration de Segurança: Converte senhas antigas para Hash SHA-256
let needsSave = false;
if (ST.adminPw && ST.adminPw.length < 64) {
  ST.adminPw = await hashPassword(ST.adminPw);
  needsSave = true;
}

if(Array.isArray(ST.drivers)){
  for (let i = 0; i < ST.drivers.length; i++) {
    let d = ST.drivers[i];
    if (typeof d === 'string') {
      ST.drivers[i] = {name: d, password: defaultPwHash};
      needsSave = true;
    } else if (d.password && d.password.length < 64) {
      ST.drivers[i].password = await hashPassword(d.password);
      needsSave = true;
    }
  }
}

if(!Array.isArray(ST.cacambas)) { ST.cacambas = []; needsSave = true; }
if(needsSave) save();

export const AppState = {
  currentDriverName: '',
  currentDay: TODAY,
  pendingChips: [],
  currentUser: null,
  pwModalTarget: null
};

