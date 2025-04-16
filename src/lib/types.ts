
export interface Produto {
  id: string;
  nome: string;
  preco: number;
  imagem: string; // Base64 ou URL
}

export interface ItemVenda {
  produto: Produto;
  quantidade: number;
}

export type FormaPagamento = "pix" | "credito" | "debito" | "dinheiro";

export interface Venda {
  id: string;
  data: string; // ISO string
  itens: ItemVenda[];
  cliente: string;
  formaPagamento: FormaPagamento;
  total: number;
}

export interface DadosGrafico {
  pix: number;
  credito: number;
  debito: number;
  dinheiro: number;
  totalVendas: number;
  produtosMaisVendidos: {nome: string, quantidade: number}[];
}
