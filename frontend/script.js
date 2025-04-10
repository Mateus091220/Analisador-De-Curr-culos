function analisar() {
    const vaga = document.getElementById("vaga").value.trim();
    const curriculo = document.getElementById("curriculo").value.trim();

    console.log("Vaga:", vaga);
    console.log("Currículo:", curriculo);

    if (!vaga || !curriculo) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const payload = {
        vaga: vaga,
        curriculo_texto: curriculo
    };

    fetch('https://analisador-de-curr-culos.onrender.com/analisar', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log("Status da resposta:", response.status);
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`Erro do servidor: ${response.status} - ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        console.log("Dados recebidos:", data);
        if (data.erro) {
            alert(data.erro);
            return;
        }

        localStorage.setItem("compatibilidade", data.score);
        localStorage.setItem("melhorias", JSON.stringify(data.melhorias));
        localStorage.setItem("presentes", JSON.stringify(data.presentes));
        localStorage.setItem("faltantes", JSON.stringify(data.faltantes));
        localStorage.setItem("modelo_ideal", data.modelo_ideal);

        // Redirecionar corretamente para a tela de resultados
        window.location.href = "resultado.html";
    })
    .catch(error => {
        console.error('Erro ao enviar ou processar:', error);
        alert("Erro ao enviar o currículo: " + error.message);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-analise");
    const uploadInput = document.getElementById("file-upload");
    const campoCurriculo = document.getElementById("curriculo");

    if (uploadInput && campoCurriculo) {
        uploadInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("curriculo_arquivo", file);

            try {
                const response = await fetch("https://analisador-de-curr-culos.onrender.com/extrair-curriculo", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();
                console.log("Texto extraído:", data);

                if (data.texto) {
                    campoCurriculo.value = data.texto; // Preencher o campo de currículo com o texto extraído
                } else {
                    alert("Não foi possível extrair o texto do currículo.");
                }
            } catch (error) {
                console.error("Erro ao processar o arquivo:", error);
                alert("Erro ao processar o currículo: " + error.message);
            }
        });
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            analisar();
        });
    }

    // Carregar dados do localStorage para a página de resultados
    const compatibilidade = localStorage.getItem("compatibilidade");
    const melhorias = JSON.parse(localStorage.getItem("melhorias"));
    const presentes = JSON.parse(localStorage.getItem("presentes"));
    const faltantes = JSON.parse(localStorage.getItem("faltantes"));
    const modeloIdeal = localStorage.getItem("modelo_ideal");

    // Atualizar a compatibilidade
    if (compatibilidade) {
        document.getElementById("compatibilidade").innerText = `${compatibilidade}%`;
        document.getElementById("progress-bar").style.width = `${compatibilidade}%`;

        // Verificação do Gráfico com Chart.js
        const ctx = document.getElementById('compatibilidade-chart').getContext('2d');
        const compatibilidadeChart = new Chart(ctx, {
            type: 'pie', // Tipo de gráfico (pode ser 'pie', 'bar', 'line', etc.)
            data: {
                labels: ['Compatibilidade', 'Outros'], // Rótulos do gráfico
                datasets: [{
                    label: 'Compatibilidade',
                    data: [compatibilidade, 100 - compatibilidade], // Dados do gráfico
                    backgroundColor: ['#4caf50', '#e0e0e0'], // Cores para compatibilidade e outros
                    borderColor: ['#388e3c', '#9e9e9e'], // Cores da borda
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true, // Responsividade do gráfico
                plugins: {
                    legend: {
                        position: 'top', // Posição da legenda
                    },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.label}: ${tooltipItem.raw}%`; // Formatação do tooltip
                            }
                        }
                    }
                }
            }
        });
    }

    // Exibir sugestões de melhorias
    if (melhorias && melhorias.length > 0) {
        const sugestoesContainer = document.getElementById("sugestoes-formatadas");
        melhorias.forEach(melhora => {
            const div = document.createElement("div");
            div.innerText = melhora;
            sugestoesContainer.appendChild(div);
        });
    }

    // Exibir palavras-chave presentes e faltantes
    if (presentes && presentes.length > 0) {
        const listaPresentes = document.getElementById("lista-presentes");
        presentes.forEach(palavra => {
            const li = document.createElement("li");
            li.innerText = palavra;
            listaPresentes.appendChild(li);
        });
    }

    if (faltantes && faltantes.length > 0) {
        const listaFaltantes = document.getElementById("lista-faltantes");
        faltantes.forEach(palavra => {
            const li = document.createElement("li");
            li.innerText = palavra;
            listaFaltantes.appendChild(li);
        });
    }

    // Exibir modelo ideal
    if (modeloIdeal) {
        document.getElementById("modeloIdeal").innerText = modeloIdeal;
    }
});

// Função para alternar a exibição do modelo ideal
function toggleModeloIdeal() {
    const modelo = document.getElementById("modeloIdeal");

    if (modelo.style.display === "none") {
        const texto = localStorage.getItem("modelo_ideal") || "Modelo ideal não encontrado.";
        modelo.innerText = texto;
        modelo.style.display = "block";
    } else {
        modelo.style.display = "none";
    }
}
