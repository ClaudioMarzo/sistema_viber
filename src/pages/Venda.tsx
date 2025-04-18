import { useEffect, useState } from "react";
import { ProdutoService, VendaService, generateId } from "@/services/api";
import { Produto, ItemVenda, FormaPagamento } from "@/lib/types";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, XCircle, Save } from "lucide-react";

export default function Venda() {
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [cliente, setCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("pix");
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: ProdutoService.getAll
  });

  useEffect(() => {
    calcularTotal();
  }, [itensVenda]);

  const adicionarItem = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto");
      return;
    }

    const itemExistente = itensVenda.find(item => item.produto.id === produtoSelecionado.id);

    if (itemExistente) {
      const novosItens = itensVenda.map(item =>
        item.produto.id === produtoSelecionado.id ? { ...item, quantidade: item.quantidade + quantidade } : item
      );
      setItensVenda(novosItens);
    } else {
      const novoItem: ItemVenda = {
        produto: produtoSelecionado,
        quantidade
      };
      setItensVenda([...itensVenda, novoItem]);
    }

    setProdutoSelecionado(null);
    setQuantidade(1);
  };

  const removerItem = (produtoId: string) => {
    const novosItens = itensVenda.filter(item => item.produto.id !== produtoId);
    setItensVenda(novosItens);
  };

  const aumentarQuantidade = (produtoId: string) => {
    const novosItens = itensVenda.map(item =>
      item.produto.id === produtoId ? { ...item, quantidade: item.quantidade + 1 } : item
    );
    setItensVenda(novosItens);
  };

  const diminuirQuantidade = (produtoId: string) => {
    const novosItens = itensVenda.map(item =>
      item.produto.id === produtoId ? { ...item, quantidade: Math.max(1, item.quantidade - 1) } : item
    );
    setItensVenda(novosItens);
  };

  const calcularTotal = () => {
    let novoTotal = 0;
    itensVenda.forEach(item => {
      novoTotal += item.produto.preco * item.quantidade;
    });
    setTotal(novoTotal);
  };

  const criarVendaMutation = useMutation({
    mutationFn: (venda: any) => VendaService.save(venda),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success("Venda registrada com sucesso!");
      limparFormulario();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda");
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itensVenda.length === 0) {
      toast.error("Adicione pelo menos um item à venda");
      return;
    }

    setIsSubmitting(true);

    const novaVenda = {
      id: generateId(),
      data: new Date().toISOString(),
      itens: itensVenda,
      cliente,
      formaPagamento,
      total
    };

    criarVendaMutation.mutate(novaVenda);
  };

  const limparFormulario = () => {
    setItensVenda([]);
    setCliente("");
    setFormaPagamento("pix");
    setTotal(0);
  };

  if (isLoading) {
    return <p>Carregando produtos...</p>;
  }

  if (error) {
    return <p>Erro ao carregar produtos.</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold tracking-tight text-white font-['Poppins']">Registrar Venda</h2>
      <p className="text-muted-foreground">Registre uma nova venda no sistema.</p>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Nova Venda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente" className="text-gray-200">Nome do Cliente</Label>
                  <Input
                    id="cliente"
                    placeholder="Ex: João Silva"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="produto" className="text-gray-200">Produto</Label>
                  <Select onValueChange={(value) => {
                    const produto = produtos.find(p => p.id === value);
                    setProdutoSelecionado(produto || null);
                  }}>
                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-700 border-zinc-600 text-white">
                      {produtos.map(produto => (
                        <SelectItem key={produto.id} value={produto.id}>{produto.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="text-gray-200">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    placeholder="1"
                    value={quantidade.toString()}
                    onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    className="bg-zinc-700 border-zinc-600 text-white"
                    min="1"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Button
                    type="button"
                    className="bg-viber-gold hover:bg-viber-gold/80 text-black"
                    onClick={adicionarItem}
                    disabled={isSubmitting}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formaPagamento" className="text-gray-200">Forma de Pagamento</Label>
                  <Select onValueChange={(value) => setFormaPagamento(value as FormaPagamento)}>
                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-700 border-zinc-600 text-white">
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-gray-200">Itens da Venda</Label>
                <Card className="bg-zinc-700 border-zinc-600">
                  <CardContent className="p-2">
                    <ScrollArea className="h-[300px] w-full rounded-md">
                      <div className="space-y-2">
                        {itensVenda.map(item => (
                          <div key={item.produto.id} className="flex items-center justify-between p-2 rounded-md bg-zinc-800">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{item.quantidade}x</Badge>
                              <span className="text-white">{item.produto.nome}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-zinc-600 text-gray-200 hover:bg-zinc-600"
                                onClick={() => diminuirQuantidade(item.produto.id)}
                                disabled={isSubmitting}
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-zinc-600 text-gray-200 hover:bg-zinc-600"
                                onClick={() => aumentarQuantidade(item.produto.id)}
                                disabled={isSubmitting}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removerItem(item.produto.id)}
                                disabled={isSubmitting}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {itensVenda.length === 0 && (
                          <p className="text-gray-400 text-center">Nenhum item adicionado.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <div className="text-right text-viber-gold text-xl font-semibold">
                  Total: R$ {total.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-600" />

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-viber-gold hover:bg-viber-gold/80 text-black"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Registrando..." : "Registrar Venda"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
