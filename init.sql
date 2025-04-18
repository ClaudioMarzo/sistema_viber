
-- Create tables
CREATE TABLE produtos (
  id VARCHAR(255) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  imagem TEXT NOT NULL
);

CREATE TABLE vendas (
  id VARCHAR(255) PRIMARY KEY,
  data TIMESTAMP NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  forma_pagamento VARCHAR(50) NOT NULL,
  total DECIMAL(10, 2) NOT NULL
);

CREATE TABLE itens_venda (
  id SERIAL PRIMARY KEY,
  venda_id VARCHAR(255) NOT NULL,
  produto_id VARCHAR(255) NOT NULL,
  quantidade INTEGER NOT NULL,
  FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE traces (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  conteudo TEXT NOT NULL
);
