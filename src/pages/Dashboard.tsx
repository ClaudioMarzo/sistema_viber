
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VendaService, TraceService } from "@/services/storage";
import { DadosGrafico, Venda, FormaPagamento } from "@/lib/types";
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Banknote, CreditCard, Wallet, QrCode } from "lucide-react";

export default function Dashboard() {
  const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico>({
    pix: 0,
    credito: 0,
    debito: 0,
    dinheiro: 0,
    totalVendas: 0,
    produtosMaisVendidos: [],
  });
  
  const [dataAtual, setDataAtual] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  const [traceContent, setTraceContent] = useState<string>("");

  useEffect(() => {
    carregarDados(dataAtual);
  }, [dataAtual]);

  const carregarDados = (data: string) => {
    const vendas = VendaService.getByDate(data);
    const trace = TraceService.getTraceByDate(new Date(data));
    setTraceContent(trace);
    
    // Calcular dados para os gráficos
    const dadosCalculados = calcularDadosGrafico(vendas);
    setDadosGrafico(dadosCalculados);
  };

  const calcularDadosGrafico = (vendas: Venda[]): DadosGrafico => {
    const resultado: DadosGrafico = {
      pix: 0,
      credito: 0,
      debito: 0,
      dinheiro: 0,
      totalVendas: 0,
      produtosMaisVendidos: [],
    };

    // Mapa para contar vendas de produtos
    const produtosContagem: Record<string, number> = {};

    vendas.forEach(venda => {
      resultado.totalVendas += venda.total;
      
      // Incrementar pagamentos por método
      resultado[venda.formaPagamento] += venda.total;
      
      // Contar produtos vendidos
      venda.itens.forEach(item => {
        const nomeProduto = item.produto.nome;
        produtosContagem[nomeProduto] = (produtosContagem[nomeProduto] || 0) + item.quantidade;
      });
    });

    // Converter mapa de produtos para array e ordenar
    resultado.produtosMaisVendidos = Object.entries(produtosContagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5); // Top 5 produtos

    return resultado;
  };

  const CORES_PAGAMENTO = ["#D4AF37", "#B87333", "#C0C0C0", "#228B22"];

  const CORES_PRODUTOS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"];

  const dadosPagamento = [
    { nome: "PIX", valor: dadosGrafico.pix, icon: QrCode },
    { nome: "Crédito", valor: dadosGrafico.credito, icon: CreditCard },
    { nome: "Débito", valor: dadosGrafico.debito, icon: Wallet },
    { nome: "Dinheiro", valor: dadosGrafico.dinheiro, icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white font-['Poppins']">Dashboard</h2>
          <p className="text-muted-foreground">Acompanhe as vendas e o fechamento do caixa.</p>
        </div>
        
        <div>
          <input 
            type="date" 
            value={dataAtual}
            onChange={(e) => setDataAtual(e.target.value)}
            className="bg-zinc-800 text-white border border-zinc-700 rounded-md px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dadosPagamento.map((metodo, i) => (
          <Card key={metodo.nome} className="bg-zinc-800 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">{metodo.nome}</CardTitle>
              <metodo.icon className="h-4 w-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-viber-gold">R$ {metodo.valor.toFixed(2).replace('.', ',')}</div>
              <p className="text-xs text-gray-400 mt-1">
                {((metodo.valor / dadosGrafico.totalVendas) * 100 || 0).toFixed(1)}% das vendas
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Métodos de Pagamento</CardTitle>
            <CardDescription>Distribuição das vendas por tipo de pagamento</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPagamento.filter(d => d.valor > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {dadosPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PAGAMENTO[index % CORES_PAGAMENTO.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2).replace('.', ',')}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Produtos Mais Vendidos</CardTitle>
            <CardDescription>Quantidade de cada produto vendido hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dadosGrafico.produtosMaisVendidos}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis 
                  dataKey="nome"
                  tick={{ fill: '#ccc' }}
                  tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                />
                <YAxis tick={{ fill: '#ccc' }} />
                <Tooltip 
                  formatter={(value) => [`${value} unidades`, "Quantidade"]}
                  contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }}
                />
                <Bar dataKey="quantidade">
                  {dadosGrafico.produtosMaisVendidos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_PRODUTOS[index % CORES_PRODUTOS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Log de Vendas</CardTitle>
          <CardDescription>Registro detalhado das vendas do dia</CardDescription>
        </CardHeader>
        <CardContent>
          {traceContent ? (
            <pre className="bg-zinc-900 p-4 rounded-md text-gray-300 text-sm font-mono h-64 overflow-y-auto">
              {traceContent}
            </pre>
          ) : (
            <p className="text-gray-400 p-4 text-center">Nenhuma venda registrada para esta data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
