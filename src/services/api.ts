import axios from 'axios';
import { Produto, Venda, DadosGrafico } from '@/lib/types';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Serviço para produtos
export const ProdutoService = {
  getAll: async (): Promise<Produto[]> => {
    const { data } = await api.get('/produtos');
    return data;
  },
  
  getById: async (id: string): Promise<Produto | undefined> => {
    try {
      const { data } = await api.get(`/produtos/${id}`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }
      throw error;
    }
  },
  
  save: async (produto: Produto): Promise<void> => {
    try {
      await api.get(`/produtos/${produto.id}`);
      await api.put(`/produtos/${produto.id}`, produto);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        await api.post('/produtos', produto);
      } else {
        throw error;
      }
    }
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/produtos/${id}`);
  }
};

// Serviço para vendas
export const VendaService = {
  getAll: async (): Promise<Venda[]> => {
    const { data } = await api.get('/vendas');
    return data;
  },
  
  getById: async (id: string): Promise<Venda | undefined> => {
    try {
      const { data } = await api.get(`/vendas/${id}`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return undefined;
      }
      throw error;
    }
  },
  
  save: async (venda: Venda): Promise<void> => {
    await api.post('/vendas', venda);
  },
  
  getByDate: async (date: string): Promise<Venda[]> => {
    const { data } = await api.get(`/vendas/data/${date}`);
    return data;
  }
};

// Serviço para arquivos de trace
export const TraceService = {
  formatTime: (date: Date): string => {
    return date.toTimeString().split(' ')[0];
  },
  
  formatDate: (date: Date): string => {
    return date.toISOString().split('T')[0];
  },
  
  addTraceEntry: async (venda: Venda): Promise<void> => {
    // This is handled by the server when saving the venda
    // Just saving the venda will add the trace entry automatically
    await VendaService.save(venda);
  },
  
  getTraceByDate: async (date: Date): Promise<string> => {
    const dateStr = TraceService.formatDate(date);
    const { data } = await api.get(`/traces/data/${dateStr}`);
    return data;
  },
  
  getAllTraceDates: async (): Promise<string[]> => {
    const { data } = await api.get('/traces/datas');
    return data;
  }
};

// Dashboard service
export const DashboardService = {
  getDadosByDate: async (date: string): Promise<DadosGrafico> => {
    const { data } = await api.get(`/dashboard/${date}`);
    return data;
  }
};

// Gerar um ID único
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
