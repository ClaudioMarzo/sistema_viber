
import express from 'express';
import cors from 'cors';
import { Produto, Venda, ItemVenda } from './lib/types';
import pool from './services/db';
import { format } from 'date-fns';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentar limite para imagens base64

// PRODUTOS API
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.get('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

app.post('/api/produtos', async (req, res) => {
  try {
    const produto: Produto = req.body;
    
    await pool.query(
      'INSERT INTO produtos (id, nome, preco, imagem) VALUES ($1, $2, $3, $4)',
      [produto.id, produto.nome, produto.preco, produto.imagem]
    );
    
    res.status(201).json({ message: 'Produto cadastrado com sucesso' });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const produto: Produto = req.body;
    
    const result = await pool.query(
      'UPDATE produtos SET nome = $1, preco = $2, imagem = $3 WHERE id = $4',
      [produto.nome, produto.preco, produto.imagem, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// VENDAS API
app.get('/api/vendas', async (req, res) => {
  try {
    // Buscar todas as vendas
    const vendasResult = await pool.query('SELECT * FROM vendas');
    const vendas = vendasResult.rows;
    
    // Para cada venda, buscar os itens associados
    const vendasCompletas = await Promise.all(
      vendas.map(async (venda) => {
        const itensResult = await pool.query(
          `SELECT iv.quantidade, p.* 
           FROM itens_venda iv 
           JOIN produtos p ON iv.produto_id = p.id 
           WHERE iv.venda_id = $1`,
          [venda.id]
        );
        
        const itens = itensResult.rows.map(row => ({
          quantidade: row.quantidade,
          produto: {
            id: row.id,
            nome: row.nome,
            preco: parseFloat(row.preco),
            imagem: row.imagem
          }
        }));
        
        return {
          id: venda.id,
          data: venda.data,
          cliente: venda.cliente,
          formaPagamento: venda.forma_pagamento,
          total: parseFloat(venda.total),
          itens
        };
      })
    );
    
    res.json(vendasCompletas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

app.get('/api/vendas/data/:data', async (req, res) => {
  try {
    const { data } = req.params;
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);
    
    // Buscar vendas do dia
    const vendasResult = await pool.query(
      'SELECT * FROM vendas WHERE data BETWEEN $1 AND $2',
      [dataInicio.toISOString(), dataFim.toISOString()]
    );
    
    const vendas = vendasResult.rows;
    
    // Para cada venda, buscar os itens associados
    const vendasCompletas = await Promise.all(
      vendas.map(async (venda) => {
        const itensResult = await pool.query(
          `SELECT iv.quantidade, p.* 
           FROM itens_venda iv 
           JOIN produtos p ON iv.produto_id = p.id 
           WHERE iv.venda_id = $1`,
          [venda.id]
        );
        
        const itens = itensResult.rows.map(row => ({
          quantidade: row.quantidade,
          produto: {
            id: row.id,
            nome: row.nome,
            preco: parseFloat(row.preco),
            imagem: row.imagem
          }
        }));
        
        return {
          id: venda.id,
          data: venda.data,
          cliente: venda.cliente,
          formaPagamento: venda.forma_pagamento,
          total: parseFloat(venda.total),
          itens
        };
      })
    );
    
    res.json(vendasCompletas);
  } catch (error) {
    console.error('Erro ao buscar vendas por data:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por data' });
  }
});

app.post('/api/vendas', async (req, res) => {
  const client = await pool.connect();
  try {
    const venda: Venda = req.body;
    
    // Iniciar transação
    await client.query('BEGIN');
    
    // Inserir venda
    await client.query(
      'INSERT INTO vendas (id, data, cliente, forma_pagamento, total) VALUES ($1, $2, $3, $4, $5)',
      [venda.id, venda.data, venda.cliente, venda.formaPagamento, venda.total]
    );
    
    // Inserir itens da venda
    for (const item of venda.itens) {
      await client.query(
        'INSERT INTO itens_venda (venda_id, produto_id, quantidade) VALUES ($1, $2, $3)',
        [venda.id, item.produto.id, item.quantidade]
      );
    }
    
    // Adicionar ao trace
    const dataObj = new Date(venda.data);
    const dataFormatada = format(dataObj, 'yyyy-MM-dd');
    const hora = format(dataObj, 'HH:mm:ss');
    
    // Formatar itens da venda
    const itensFormatados = venda.itens.map(item => 
      `${item.produto.nome} (${item.quantidade})`
    ).join(", ");
    
    // Formatar preço total
    const totalFormatado = venda.total.toFixed(2).replace('.', ',');
    
    // Criar entrada de trace
    const novaEntrada = `[${hora}] | Cliente: ${venda.cliente} | Bebidas: ${itensFormatados} | Pagamento: ${venda.formaPagamento.charAt(0).toUpperCase() + venda.formaPagamento.slice(1)} | Total: R$ ${totalFormatado}\n`;
    
    // Verificar se já existe trace para esta data
    const traceResult = await client.query(
      'SELECT * FROM traces WHERE data = $1',
      [dataFormatada]
    );
    
    if (traceResult.rows.length > 0) {
      // Atualizar trace existente
      await client.query(
        'UPDATE traces SET conteudo = conteudo || $1 WHERE data = $2',
        [novaEntrada, dataFormatada]
      );
    } else {
      // Criar novo trace
      await client.query(
        'INSERT INTO traces (data, conteudo) VALUES ($1, $2)',
        [dataFormatada, novaEntrada]
      );
    }
    
    // Finalizar transação
    await client.query('COMMIT');
    
    res.status(201).json({ message: 'Venda registrada com sucesso' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  } finally {
    client.release();
  }
});

// TRACE API
app.get('/api/traces/data/:data', async (req, res) => {
  try {
    const { data } = req.params;
    const { rows } = await pool.query('SELECT conteudo FROM traces WHERE data = $1', [data]);
    
    if (rows.length === 0) {
      return res.json('');
    }
    
    res.json(rows[0].conteudo);
  } catch (error) {
    console.error('Erro ao buscar trace:', error);
    res.status(500).json({ error: 'Erro ao buscar trace' });
  }
});

app.get('/api/traces/datas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT data FROM traces ORDER BY data');
    const datas = rows.map(row => format(new Date(row.data), 'yyyy-MM-dd'));
    res.json(datas);
  } catch (error) {
    console.error('Erro ao buscar datas de traces:', error);
    res.status(500).json({ error: 'Erro ao buscar datas de traces' });
  }
});

// Dados do Dashboard
app.get('/api/dashboard/:data', async (req, res) => {
  try {
    const { data } = req.params;
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);
    
    // Buscar totais por forma de pagamento
    const pagamentosResult = await pool.query(
      `SELECT forma_pagamento, SUM(total) as total
       FROM vendas 
       WHERE data BETWEEN $1 AND $2
       GROUP BY forma_pagamento`,
      [dataInicio.toISOString(), dataFim.toISOString()]
    );
    
    // Buscar produtos mais vendidos
    const produtosResult = await pool.query(
      `SELECT p.nome, SUM(iv.quantidade) as quantidade
       FROM itens_venda iv
       JOIN produtos p ON iv.produto_id = p.id
       JOIN vendas v ON iv.venda_id = v.id
       WHERE v.data BETWEEN $1 AND $2
       GROUP BY p.nome
       ORDER BY quantidade DESC
       LIMIT 5`,
      [dataInicio.toISOString(), dataFim.toISOString()]
    );
    
    // Calcular total de vendas
    const totalResult = await pool.query(
      'SELECT SUM(total) as total FROM vendas WHERE data BETWEEN $1 AND $2',
      [dataInicio.toISOString(), dataFim.toISOString()]
    );
    
    const totalVendas = parseFloat(totalResult.rows[0]?.total || '0');
    
    // Montar objeto de resposta
    const dadosGrafico = {
      pix: 0,
      credito: 0,
      debito: 0,
      dinheiro: 0,
      totalVendas,
      produtosMaisVendidos: produtosResult.rows.map(row => ({
        nome: row.nome,
        quantidade: parseInt(row.quantidade)
      }))
    };
    
    // Preencher valores por forma de pagamento
    pagamentosResult.rows.forEach(row => {
      const formaPagamento = row.forma_pagamento as 'pix' | 'credito' | 'debito' | 'dinheiro';
      dadosGrafico[formaPagamento] = parseFloat(row.total);
    });
    
    res.json(dadosGrafico);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
