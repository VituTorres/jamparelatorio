import { StorageService } from './storage.js';
import { hashPassword } from './utils.js';

const _d = new Date();
export const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

export let ST = null; 

// Agora o save é assíncrono para esperar a nuvem
export async function save() {
  if (ST) {
    await StorageService.saveDatabase(ST);
  }
}

export async function initApp() {
  try {
    const data = await StorageService.getDatabase();
    const defaultPwHash = await hashPassword('1234');
    
    if (!data) {
      const newData = {
        drivers: [
          {name:'Carlos',password:defaultPwHash}, {name:'Marcos',password:defaultPwHash},
          {name:'Rafael',password:defaultPwHash}, {name:'Leandro',password:defaultPwHash}
        ],
        services: [],
        adminPw: defaultPwHash,
        cacambas: []
      };
      await StorageService.saveDatabase(newData);
      ST = newData;
    } else {
      ST = data;
    }

    if(!ST.services) ST.services = [];
    if(!ST.cacambas) ST.cacambas = [];
    if(!ST.drivers) ST.drivers = [];

  } catch (e) {
    console.error("Erro no initApp:", e);
    throw e;
  }
}

export const AppState = {
  currentDriverName: '',
  currentDay: TODAY,
  pendingChips: [],
  currentUser: null,
  pwModalTarget: null
};