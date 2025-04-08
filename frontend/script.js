function analisar() {
    let vaga = document.getElementById("vaga").value.trim();
    let curriculo = document.getElementById("curriculo").value.trim();

    if (!vaga || !curriculo) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    fetch("http://127.0.0.1:5000/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vaga, curriculo })
    })
    .then(response => response.json())
    .then(data => {
        localStorage.setItem("compatibilidade", data.score);
        localStorage.setItem("melhorias", JSON.stringify(data.melhorias));
        localStorage.setItem("presentes", JSON.stringify(data.presentes));
        localStorage.setItem("faltantes", JSON.stringify(data.faltantes));
        localStorage.setItem("modelo_ideal", data.modelo_ideal);
        window.location.href = "resultado.html";
    })
    .catch(error => console.error("Erro ao analisar:", error));
}

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("compatibilidade")) {
        let score = localStorage.getItem("compatibilidade");
        let melhorias = JSON.parse(localStorage.getItem("melhorias"));
        let presentes = JSON.parse(localStorage.getItem("presentes") || "[]");
        let faltantes = JSON.parse(localStorage.getItem("faltantes") || "[]");

        // Exibe palavras presentes
        const ulPresentes = document.getElementById("lista-presentes");
        presentes.forEach(palavra => {
            const li = document.createElement("li");
            li.textContent = palavra;
            ulPresentes.appendChild(li);
        });

        // Exibe palavras faltantes
        const ulFaltantes = document.getElementById("lista-faltantes");
        faltantes.forEach(palavra => {
            const li = document.createElement("li");
            li.textContent = palavra;
            ulFaltantes.appendChild(li);
        });

        // Gera gráfico
        const ctx = document.getElementById('graficoPalavras').getContext('2d');
        const grafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Palavras Presentes', 'Palavras Faltantes'],
                datasets: [{
                    label: 'Quantidade',
                    data: [10,5],
                    backgroundColor: ['#2ecc71', '#e74c3c'],
                    borderRadius: 8,
                    barThickness: 60,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: context => ` ${context.dataset.label}: ${context.formattedValue}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 14
                            }
                        },
                        grid: {
                            color: '#eee'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 14
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Atualiza barra de compatibilidade
        const barra = document.getElementById("progress-bar");
        barra.style.width = `${score}%`;

        if (score < 50) {
            barra.style.backgroundColor = "#e74c3c"; // vermelho
        } else if (score < 80) {
            barra.style.backgroundColor = "#f1c40f"; // amarelo
        } else {
            barra.style.backgroundColor = "#2ecc71"; // verde
        }

        document.getElementById("compatibilidade").textContent = score + "%";

        // Agrupa sugestões por prioridade
        const prioridades = {
            "Essencial": [],
            "Importante": [],
            "Opcional": []
        };

        if (Array.isArray(melhorias)) {
            melhorias.forEach(item => {
                const prioridade = prioridades[item.prioridade] ? item.prioridade : "Opcional";
                prioridades[prioridade].push(item.mensagem);
            });
        }

        // Limpa sugestões anteriores
        const sugestoesDiv = document.getElementById("sugestoes-formatadas");
        sugestoesDiv.innerHTML = "";

        // Cria blocos para cada prioridade
        Object.keys(prioridades).forEach(prioridade => {
            if (prioridades[prioridade].length > 0) {
                const bloco = document.createElement("div");
                bloco.classList.add("bloco-sugestao");

                const titulo = document.createElement("h4");
                let icone = "";

                switch (prioridade) {
                    case "Essencial":
                        icone = "alert-triangle";
                        break;
                    case "Importante":
                        icone = "info";
                        break;
                    case "Opcional":
                        icone = "lightbulb";
                        break;
                }

                titulo.innerHTML = `<i data-lucide="${icone}"></i> ${prioridade}`;
                bloco.appendChild(titulo);

                const lista = document.createElement("ul");
                lista.classList.add("lista-sugestoes");

                prioridades[prioridade].forEach(msg => {
                    const li = document.createElement("li");
                    li.textContent = msg;
                    lista.appendChild(li);
                });

                bloco.appendChild(lista);
                sugestoesDiv.appendChild(bloco);
            }
        });

        lucide.createIcons(); // Ativa os ícones Lucide
    }
});
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