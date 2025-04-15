// Função para processar os dados armazenados no localStorage
document.addEventListener("DOMContentLoaded", () => {
    // Verificar se estamos na página correta (resultado.html)
    if (!window.location.pathname.includes("resultado.html")) return;

    // Lê os dados armazenados no localStorage
    const compatibilidade = parseFloat(localStorage.getItem("compatibilidade") || "0");
    const melhorias = JSON.parse(localStorage.getItem("melhorias") || "[]");
    const presentes = JSON.parse(localStorage.getItem("presentes") || "[]");
    const faltantes = JSON.parse(localStorage.getItem("faltantes") || "[]");
    const modeloIdeal = localStorage.getItem("modelo_ideal");

    // Atualiza a compatibilidade na página
    const compatEl = document.getElementById("compatibilidade");
    const progress = document.getElementById("progress-bar");

    if (compatEl && compatibilidade) {
        compatEl.innerText = `${compatibilidade}%`;
    }

    if (progress && compatibilidade) {
        progress.style.width = `${compatibilidade}%`;
    }

    // Geração do gráfico de compatibilidade usando o Chart.js
    const graficoEl = document.getElementById("graficoPalavras");
    if (graficoEl && compatibilidade) {
        const ctx = graficoEl.getContext("2d");
        const valor = parseFloat(compatibilidade);

        new Chart(ctx, {
            type: "pie",
            data: {
                labels: ["Compatibilidade", "Restante"],
                datasets: [{
                    data: [valor, 100 - valor],
                    backgroundColor: ["#4caf50", "#e0e0e0"],
                    borderColor: ["#388e3c", "#9e9e9e"],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });
    }

    // Exibe as sugestões de melhorias no currículo
    const sugestoesContainer = document.getElementById("sugestoes-formatadas");
    if (sugestoesContainer && melhorias.length > 0) {
        melhorias.forEach(item => {
            const div = document.createElement("div");
            div.classList.add("sugestao");
            div.innerText = item;
            sugestoesContainer.appendChild(div);
        });
    }

    // Exibe as palavras-chave presentes no currículo
    const listaPresentes = document.getElementById("lista-presentes");
    if (listaPresentes && presentes.length > 0) {
        presentes.forEach(palavra => {
            const li = document.createElement("li");
            li.innerText = palavra;
            listaPresentes.appendChild(li);
        });
    }

    // Exibe as palavras-chave faltantes no currículo
    const listaFaltantes = document.getElementById("lista-faltantes");
    if (listaFaltantes && faltantes.length > 0) {
        faltantes.forEach(palavra => {
            const li = document.createElement("li");
            li.innerText = palavra;
            listaFaltantes.appendChild(li);
        });
    }

    // Exibe o currículo ideal
    const modeloEl = document.getElementById("modeloIdeal");
    if (modeloEl && modeloIdeal) {
        modeloEl.textContent = modeloIdeal;
    }
});

// Função para alternar a exibição do modelo ideal
function toggleModeloIdeal() {
    const el = document.getElementById("modeloIdeal");
    if (el) {
        el.style.display = el.style.display === "none" ? "block" : "none";
    }
}

// Função para exibir as sugestões de melhorias de forma interativa
function mostrarSugestoes() {
    const suggestionsContainer = document.getElementById("sugestoes-formatadas");
    if (suggestionsContainer) {
        suggestionsContainer.style.display = "block";
    }
}

// Função para atualizar a barra de progresso da compatibilidade com animação
function updateProgressBar(compatibilidade) {
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
        progressBar.style.transition = "width 1s ease-out";
        progressBar.style.width = `${compatibilidade}%`;
    }
}

// Função para preencher o modelo ideal de currículo
function gerarModeloIdeal() {
    const modeloIdeal = localStorage.getItem("modelo_ideal");
    const modeloEl = document.getElementById("modeloIdeal");
    if (modeloEl && modeloIdeal) {
        modeloEl.innerText = modeloIdeal;
    }
}

// Função para aplicar os estilos dinâmicos de acordo com a compatibilidade
function aplicarEstilos(compatibilidade) {
    const progressBar = document.getElementById("progress-bar");
    if (!progressBar) return;

    if (compatibilidade >= 80) {
        progressBar.style.backgroundColor = "#4caf50"; // Verde
    } else if (compatibilidade >= 50) {
        progressBar.style.backgroundColor = "#ff9800"; // Laranja
    } else {
        progressBar.style.backgroundColor = "#f44336"; // Vermelho
    }
}


// Função para exibir um alerta ao usuário com dicas de como melhorar o currículo
function mostrarAlertaMelhoria() {
    const alerta = document.createElement("div");
    alerta.classList.add("alerta");
    alerta.innerHTML = `<p><strong>Dica:</strong> Adicione mais experiências profissionais e habilidades técnicas para melhorar sua compatibilidade com a vaga!</p>`;
    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 5000);
}

// Carregar as sugestões e a compatibilidade ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    const compatibilidade = localStorage.getItem("compatibilidade");
    const melhorias = JSON.parse(localStorage.getItem("melhorias") || "[]");
    const presentes = JSON.parse(localStorage.getItem("presentes") || "[]");
    const faltantes = JSON.parse(localStorage.getItem("faltantes") || "[]");

    // Exibe a compatibilidade
    updateProgressBar(compatibilidade);
    aplicarEstilos(compatibilidade);

    // Exibe as sugestões de melhoria
    if (melhorias.length > 0) {
        mostrarSugestoes();
    }

    // Exibe o modelo ideal de currículo
    gerarModeloIdeal();
});
