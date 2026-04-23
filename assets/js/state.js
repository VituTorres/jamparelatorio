import { StorageService } from './storage.js';
import { hashPassword } from './utils.js';

const _d = new Date();
export const TODAY = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

export let ST = null; 

export function save() {
  if(ST) StorageService.saveDatabase(ST);
}

export async function initApp() {
  try {
    let data = await StorageService.getDatabase();
    const defaultPwHash = await hashPassword('1234');
    
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

    if(!data.services) data.services = [];
    if(!data.cacambas) data.cacambas = [];
    if(!data.drivers) data.drivers = [];

    ST = data;
  } catch (e) {
    console.error("Falha ao carregar ST:", e);
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