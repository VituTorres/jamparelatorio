export const StorageService = {
  DB_KEY: 'cacamba_v4',
  
  getDatabase: function() {
    try {
      const data = localStorage.getItem(this.DB_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erro ao ler o BD:", error);
      return null;
    }
  },
  
  saveDatabase: function(data) {
    try {
      localStorage.setItem(this.DB_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao salvar no BD:", error);
    }
  }
};