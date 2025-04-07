// Importar bibliotecas
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Criar o servidor
const app = express();
app.use(cors()); // Permitir conexões externas
app.use(express.json()); // Permitir JSON nas requisições

// Rota inicial para testar se está funcionando
app.get('/', (req, res) => {
    res.send('API do Analisador de Currículos está rodando!');
});

// Rota para verificar se o servidor está ativo
app.get('/status', (req, res) => {
    res.json({ status: "API funcionando corretamente!" });
});

// Rota para analisar a compatibilidade do currículo com a vaga
app.post('/analisar', (req, res) => {
    console.log("🔍 Analisando compatibilidade...");
    console.log("📩 Dados recebidos:", req.body);

    const { vaga, curriculo } = req.body;

    if (!vaga || !curriculo) {
        return res.status(400).json({ error: "Envie a descrição da vaga e o currículo." });
    }

    // Normalizar texto (converter para minúsculas e remover pontuações)
    const normalizarTexto = texto => texto.toLowerCase().replace(/[.,!?;]/g, '').split(/\s+/);

    const palavrasVaga = normalizarTexto(vaga);
    const palavrasCurriculo = normalizarTexto(curriculo);

    let match = 0;
    palavrasVaga.forEach(palavra => {
        if (palavrasCurriculo.includes(palavra)) {
            match++;
        }
    });

    // Evitar divisão por zero
    const compatibilidade = palavrasVaga.length > 0 ? Math.round((match / palavrasVaga.length) * 100) : 0;

    console.log(`📊 Compatibilidade calculada: ${compatibilidade}%`);
    
    res.json({ compatibilidade: `${compatibilidade}%`, mensagem: "Análise concluída!" });
});

// Rota para sugerir melhorias no currículo
app.post('/melhorias', (req, res) => {
    console.log("📋 Sugerindo melhorias...");
    
    const { curriculo } = req.body;

    if (!curriculo) {
        return res.status(400).json({ error: "Envie o conteúdo do currículo." });
    }

    let sugestoes = [];

    const palavrasChave = ["projetos", "certificação", "habilidades", "experiência", "formação", "objetivo"];
    palavrasChave.forEach(palavra => {
        if (!curriculo.toLowerCase().includes(palavra)) {
            sugestoes.push(`Considere adicionar uma seção de ${palavra}.`);
        }
    });

    // Sugerir melhorias na formatação, se o currículo for muito curto
    const linhas = curriculo.split("\n").filter(linha => linha.trim() !== '');
    if (linhas.length < 5) {
        sugestoes.push("Seu currículo parece curto. Tente expandir as descrições de suas experiências e habilidades.");
    }

    console.log("✅ Melhorias sugeridas:", sugestoes);
    
    res.json({ melhorias: sugestoes });
});

// Definir a porta do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
