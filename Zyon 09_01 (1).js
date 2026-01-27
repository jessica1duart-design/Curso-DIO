const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const randomDelay = () => Math.floor(Math.random() * 2000) + 3000;

const tempDir = 'C:\\TempBot';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// 🔁 Grupos
const gruposAutomacao = {
    'Report Indicadores - Torre de Controle Logística': '120363421106337765@g.us',
    'Automação Pátio Ribas': '120363406815725350@g.us',
    'Reports Torre - Logística': '120363321329780157@g.us'
};

const gruposRitmoPBTC = {
    'Report Indicadores - Torre de Controle Logística': '120363421106337765@g.us',
    'CCO SUZANO': '120363248217104870@g.us',
    'Reports Torre - Logística': '120363321329780157@g.us'
};

const gruposRitmoD1 = {
    'Report Indicadores - Torre de Controle Logística': '120363421106337765@g.us',
    'CCO SUZANO': '120363248217104870@g.us',
    'Reports Torre - Logística': '120363321329780157@g.us'
};

const gruposAutomacaoGruas = {
    'Automação Pátio Ribas': '120363406815725350@g.us'
};

// 📜 Histórico de envios
const historicoEnvios = [];
const MAX_ENVIO_LOG = 15;

function registrarEnvio(tag) {
    const registro = `[${new Date().toLocaleString('pt-BR')}] ${tag}`;
    historicoEnvios.unshift(registro);
    if (historicoEnvios.length > MAX_ENVIO_LOG) historicoEnvios.pop();
}

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'fluxos' }),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    const qrcode = require('qrcode-terminal');
    console.log('📌 Escaneie o QR para autenticar:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ BOT FLUXOS PRONTO!');

    // Mostrar histórico de envios
    console.log("📜 Últimos envios:");
    if (historicoEnvios.length === 0) {
        console.log("Nenhum envio registrado ainda.");
    } else {
        historicoEnvios.forEach(envio => console.log(envio));
    }

    // Horários para Ritmo/PBTC
    const horariosRitmoPBTC = ['30 3 * * *', '30 5 * * *', '30 9 * * *', '30 11 * * *', '30 13 * * *', '30 15 * * *', '30 19 * * *', '30 23 * * *'];
    horariosRitmoPBTC.forEach(horario => {
        cron.schedule(horario, () => agendarComJitter(fluxoRitmoPBTC, 'Ritmo/PBTC'));
    });

    // Automação do pátio Ribas - enviar às 06:30
    cron.schedule('30 6 * * *', () => agendarComJitter(enviarAutomacaoPatioRibas, 'Automação Pátio Ribas'));

    // Automação do pátio Reports Torre - enviar às 18:30
    cron.schedule('30 18 * * *', () => agendarComJitter(enviarAutomacaoReportsTorre, 'Reports Torre - Logística'));

    // Ritmo D-1 nos grupos novos às 03:30
    cron.schedule('20 3 * * *', () => agendarComJitter(fluxoRitmoD1, 'Ritmo D-1'));

    // Automação do pátio Gruas com os horários indicados
    const horariosAutomacaoGruas = ['30 3 * * *', '30 5 * * *', '30 9 * * *', '30 11 * * *', '30 13 * * *', '30 15 * * *', '30 19 * * *', '30 23 * * *'];
    horariosAutomacaoGruas.forEach(horario => {
        cron.schedule(horario, () => agendarComJitter(fluxoAutomacaoGruas, 'Automação Gruas'));
    });
});

function agendarComJitter(funcao, tag) {
    const jitter = Math.floor(Math.random() * 6) * 60000;
    console.log(`⏰ ${funcao.name} [${tag}] com jitter +${jitter / 60000} min`);
    setTimeout(() => funcao(), jitter);
}

function saudacaoPorHorario() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
}

function horaFormatada() {
    const hora = new Date().getHours();
    return `${hora.toString().padStart(2, '0')}h`;
}

function gerarLegendaAutomacao(nomeArquivo) {
    const horaEnvio = horaFormatada();
    return `${horaEnvio} - Automação Pátio UNF Ribas`;
}

let emExecucaoAutomacaoPatio = false;
let emExecucaoAutomacaoReportsTorre = false;
let emExecucaoRitmo = false;
let emExecucaoRitmoD1 = false;
let emExecucaoAutomacaoGruas = false;

// Função para enviar automação Pátio Ribas
async function enviarAutomacaoPatioRibas() {
    if (emExecucaoAutomacaoPatio) {
        console.log('⏳ Envio Automação Pátio Ribas já está em execução. Ignorando...');
        return;
    }
    emExecucaoAutomacaoPatio = true;
    try {
        registrarEnvio("Automação Pátio Ribas");
        console.log(`[DEBUG] Enviando Automação Pátio Ribas - ${new Date().toLocaleString('pt-BR')}`);
        const saudacao = saudacaoPorHorario();
        const arquivosAutomacao = [
            'Automação_Pátio_CJR.pdf',
            'Automação_Pátio_CJR_TLS.pdf',
            'Automação_Pátio_EN.pdf',
            'Automação_Pátio_Geral.pdf',
            'Automação_Pátio_JSL.pdf',
            'Automação_Pátio_SUZANO.pdf',
            'Automação_Pátio_+ENERGIA.pdf',
            'Automação_Pátio_SNA.pdf'
        ];
const pastaAutomacao = 'C:\\Users\\jessica.ds\\Suzano S A\\TORRE DE CONTROLE - CERRADO - 008_AUTOENVIO\\LOGÍSTICA\\Automação do pátio';
        const idGrupo = gruposAutomacao['Automação Pátio Ribas'];
        const grupo = await client.getChatById(idGrupo);

        await grupo.sendMessage(`${saudacao},\nSegue os relatórios de automação de pátio das EPS`);

        for (const nome of arquivosAutomacao) {
            const caminho = path.join(pastaAutomacao, nome);
            const tempPath = path.join(tempDir, nome);
            if (fs.existsSync(caminho)) {
                const stats = fs.statSync(caminho);
                if (stats.size === 0) continue;
                fs.copyFileSync(caminho, tempPath);
                try {
                    const media = MessageMedia.fromFilePath(tempPath);
                    const legenda = gerarLegendaAutomacao(nome);
                    await grupo.sendMessage(media, { caption: legenda });
                    await sleep(randomDelay());
                } catch (err) {
                    console.error(`❌ Erro ao enviar ${nome} para Automação Pátio Ribas:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro no envio Automação Pátio Ribas:', error.message);
    } finally {
        emExecucaoAutomacaoPatio = false;
    }
}

// Função para enviar automação Reports Torre (grupo específico)
async function enviarAutomacaoReportsTorre() {
    if (emExecucaoAutomacaoReportsTorre) {
        console.log('⏳ Envio Automação Reports Torre já está em execução. Ignorando...');
        return;
    }
    emExecucaoAutomacaoReportsTorre = true;
    try {
        console.log(`[DEBUG] Enviando Automação Reports Torre - ${new Date().toLocaleString('pt-BR')}`);
        const saudacao = saudacaoPorHorario();
        const arquivosAutomacao = [
            'Automação_Pátio_Geral.pdf'
        ];
        const pastaAutomacao = 'C:\\Users\\jessica.ds\\Suzano S A\\TORRE DE CONTROLE - CERRADO - 008_AUTOENVIO\\LOGÍSTICA\\Automação do pátio';
        const idGrupo = gruposAutomacao['Reports Torre - Logística'];
        const grupo = await client.getChatById(idGrupo);

        await grupo.sendMessage(`${saudacao},\nSegue os relatórios de automação de pátio das EPS`);

        for (const nome of arquivosAutomacao) {
            const caminho = path.join(pastaAutomacao, nome);
            const tempPath = path.join(tempDir, nome);
            if (fs.existsSync(caminho)) {
                const stats = fs.statSync(caminho);
                if (stats.size === 0) continue;
                fs.copyFileSync(caminho, tempPath);
                try {
                    const media = MessageMedia.fromFilePath(tempPath);
                    const legenda = gerarLegendaAutomacao(nome);
                    await grupo.sendMessage(media, { caption: legenda });
                    await sleep(randomDelay());
                } catch (err) {
                    console.error(`❌ Erro ao enviar ${nome} para Reports Torre:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro no envio Automação Reports Torre:', error.message);
    } finally {
        emExecucaoAutomacaoReportsTorre = false;
    }
}

// fluxo Automação Gruas
async function fluxoAutomacaoGruas() {
    if (emExecucaoAutomacaoGruas) {
        console.log('⏳ fluxoAutomacaoGruas já está em execução. Ignorando...');
        return;
    }
    emExecucaoAutomacaoGruas = true;
    try {
        console.log(`[DEBUG] Executando fluxoAutomacaoGruas - ${new Date().toLocaleString('pt-BR')}`);
        const saudacao = saudacaoPorHorario();
        const arquivos = [
            'Automação_Pátio_-_Gruas.pdf',
            'Automação_Pátio_-_Placas.pdf'
        ];
        const pastaGruas = 'C:\\Users\\jessica.ds\\Suzano S A\\TORRE DE CONTROLE - CERRADO - 008_AUTOENVIO\\LOGÍSTICA\\Automação do pátio Gruas';

        for (const [nomeGrupo, idGrupo] of Object.entries(gruposAutomacaoGruas)) {
            const grupo = await client.getChatById(idGrupo);
            await grupo.sendMessage(`${saudacao},\nSegue os relatórios de automação do pátio - Gruas`);

            for (const nome of arquivos) {
                const caminho = path.join(pastaGruas, nome);
                const tempPath = path.join(tempDir, nome);
                if (fs.existsSync(caminho)) {
                    const stats = fs.statSync(caminho);
                    if (stats.size === 0) continue;
                    fs.copyFileSync(caminho, tempPath);
                    try {
                        const media = MessageMedia.fromFilePath(tempPath);
                        const legenda = `${horaFormatada()} - Automação Pátio - ${nome.replace('.pdf','')}`;
                        await grupo.sendMessage(media, { caption: legenda });
                        await sleep(randomDelay());
                    } catch (err) {
                        console.error(`❌ Erro ao enviar ${nome} para ${nomeGrupo}:`, err.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro no fluxoAutomacaoGruas:', error.message);
    } finally {
        emExecucaoAutomacaoGruas = false;
    }
}

// Fluxo Ritmo PBTC
async function fluxoRitmoPBTC() {
    if (emExecucaoRitmo) {
        console.log('⏳ fluxoRitmoPBTC já está em execução. Ignorando...');
        return;
    }
    emExecucaoRitmo = true;
    try {
        console.log(`[DEBUG] Executando fluxoRitmoPBTC - ${new Date().toLocaleString('pt-BR')}`);
        const saudacao = saudacaoPorHorario();
        const horaEnvio = horaFormatada();
        const arquivos = ['PBTC.pdf', 'RITMO.pdf'];
        const pastaPBTC = 'C:\\Users\\jessica.ds\\Suzano S A\\TORRE DE CONTROLE - CERRADO - 008_AUTOENVIO\\LOGÍSTICA\\Ritmo e PBTC';

        for (const [nomeGrupo, idGrupo] of Object.entries(gruposRitmoPBTC)) {
            const grupo = await client.getChatById(idGrupo);
            await grupo.sendMessage(`${saudacao},\nCompartilhando Ritmo e PBTC das ${horaEnvio}`);

            for (const nome of arquivos) {
                const caminho = path.join(pastaPBTC, nome);
                const tempPath = path.join(tempDir, nome);
                if (fs.existsSync(caminho)) {
                    const stats = fs.statSync(caminho);
                    if (stats.size === 0) continue;
                    fs.copyFileSync(caminho, tempPath);
                    try {
                        const media = MessageMedia.fromFilePath(tempPath);
                        const legenda = `${horaEnvio} - ${nome.replace('.pdf', '')}`;
                        await grupo.sendMessage(media, { caption: legenda });
                        await sleep(randomDelay());
                    } catch (err) {
                        console.error(`❌ Erro ao enviar ${nome} para ${nomeGrupo}:`, err.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro no fluxoRitmoPBTC:', error.message);
    } finally {
        emExecucaoRitmo = false;
    }
}

// Fluxo Ritmo D-1
async function fluxoRitmoD1() {
    if (emExecucaoRitmoD1) {
        console.log('⏳ fluxoRitmoD1 já está em execução. Ignorando...');
        return;
    }
    emExecucaoRitmoD1 = true;
    try {
        console.log(`[DEBUG] Executando fluxoRitmoD1 - ${new Date().toLocaleString('pt-BR')}`);
        const saudacao = saudacaoPorHorario();
        const horaEnvio = horaFormatada();
        const arquivos = ['PBTC_D-1.pdf', 'RITMO_D-1.pdf'];
        const pastaPBTC1 = 'C:\\Users\\jessica.ds\\Suzano S A\\TORRE DE CONTROLE - CERRADO - 008_AUTOENVIO\\LOGÍSTICA\\Ritmo e PBTC D-1';

        for (const [nomeGrupo, idGrupo] of Object.entries(gruposRitmoD1)) {
            const grupo = await client.getChatById(idGrupo);
            await grupo.sendMessage(`${saudacao},\nSegue os relatórios Ritmo D-1`);

            for (const arquivo of arquivos) {
                const caminho = path.join(pastaPBTC1, arquivo);
                const tempPath = path.join(tempDir, arquivo);
                if (fs.existsSync(caminho)) {
                    const stats = fs.statSync(caminho);
                    if (stats.size === 0) continue;
                    fs.copyFileSync(caminho, tempPath);
                    try {
                        const media = MessageMedia.fromFilePath(tempPath);
                        const legenda = `00h - ${arquivo.replace('.pdf', '')}`;
                        await grupo.sendMessage(media, { caption: legenda });
                        await sleep(randomDelay());
                    } catch (err) {
                        console.error(`❌ Erro ao enviar ${arquivo} para ${nomeGrupo}:`, err.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Erro no fluxoRitmoD1:', error.message);
    } finally {
        emExecucaoRitmoD1 = false;
    }
}

client.initialize();