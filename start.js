
import { spawn } from 'child_process';

// Define os comandos para iniciar os serviços
const commands = [
  {
    name: 'Docker',
    command: 'docker compose',
    args: ['up', '-d'],
    workingDir: process.cwd(),
  },
  {
    name: 'API',
    command: process.platform === 'win32' ? 'npx' : 'npx',
    args: ['tsx', './src/server.ts'],
    workingDir: process.cwd(),
  },
  {
    name: 'Frontend',
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    workingDir: process.cwd(),
  },
];

// Função para iniciar um serviço
function startService(service) {
  console.log(`Iniciando ${service.name}...`);

  const proc = spawn(service.command, service.args, {
    cwd: service.workingDir,
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  proc.stderr.on('data', (data) => {
    console.error(`[${service.name}] ${data.toString().trim()}`);
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`${service.name} encerrado com código ${code}`);
    }
  });

  return proc;
}

// Inicia todos os serviços em sequência
async function startAll() {
  console.log('Iniciando todos os serviços...');

  // Inicia Docker primeiro
  const dockerService = commands.find(cmd => cmd.name === 'Docker');
  const dockerProc = startService(dockerService);

  // Espera Docker iniciar antes de continuar
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Inicia os demais serviços
  for (const service of commands) {
    if (service.name !== 'Docker') {
      startService(service);
    }
  }

  console.log('Todos os serviços foram iniciados!');
  console.log('Pressione Ctrl+C para encerrar todos os serviços.');
}

// Inicia os serviços
startAll().catch(err => {
  console.error('Erro ao iniciar serviços:', err);
});

// Captura o sinal de interrupção para encerrar graciosamente
process.on('SIGINT', () => {
  console.log('Encerrando todos os serviços...');
  
  // Para os containers Docker
  spawn('docker compose', ['down'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  }).on('close', () => {
    console.log('Docker containers encerrados.');
    process.exit(0);
  });
});
