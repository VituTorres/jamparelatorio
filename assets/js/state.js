import { StorageService } from './storage.js';
import { hashPassword } from './utils.js';

// LÓGICA DE DATA LOCAL (Garante que só mude de dia à meia-noite do Brasil)
const _d = new Date();
export const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

export let ST = null; 

export function save() {
  if(ST) StorageService.saveDatabase(ST);
}

// Inicializa o aplicativo e sincroniza com a Nuvem
export async function initApp() {
  let data = await StorageService.getDatabase();
  const defaultPwHash = await hashPassword('1234');
  
  // Se o banco novo estiver vazio, cria a estrutura inicial
  if (!data) {
    data = {
      drivers: [
        {name:'Carlos',password:defaultPwHash}, {name:'Marcos',password:defaultPwHash},
        {name:'Rafael',password:defaultPwHash}, {name:'Leandro',password:defaultPwHash}
      ],
      services: [],
      adminPw: defaultPwHash,
      cacambas: []
    };
    await StorageService.saveDatabase(data);
  }

  // Migrações de segurança
  let needsSave = false;
  if (data.adminPw && data.adminPw.length < 64) {
    data.adminPw = await hashPassword(data.adminPw);
    needsSave = true;
  }

  if(Array.isArray(data.drivers)){
    for (let i = 0; i < data.drivers.length; i++) {
      let d = data.drivers[i];
      if (typeof d === 'string') {
        data.drivers[i] = {name: d, password: defaultPwHash};
        needsSave = true;
      } else if (d.password && d.password.length < 64) {
        data.drivers[i].password = await hashPassword(d.password);
        needsSave = true;
      }
    }
  }

  if(!Array.isArray(data.cacambas)) { data.cacambas = []; needsSave = true; }
  
  ST = data; 
  if(needsSave) save();
}

export const AppState = {
  currentDriverName: '',
  currentDay: TODAY,
  pendingChips: [],
  currentUser: null,
  pwModalTarget: null
};