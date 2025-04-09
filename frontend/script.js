function analisar() {
    const vaga = document.getElementById("vaga").value.trim();
    const curriculo = document.getElementById("curriculo").value.trim();

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
        if (!response.ok) {
            throw new Error(`Erro do servidor: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.erro) {
            alert(data.erro);
            return;
        }

        localStorage.setItem("compatibilidade", data.score);
        localStorage.setItem("melhorias", JSON.stringify(data.melhorias));
        localStorage.setItem("presentes", JSON.stringify(data.presentes));
        localStorage.setItem("faltantes", JSON.stringify(data.faltantes));
        localStorage.setItem("modelo_ideal", data.modelo_ideal);
        window.location.href = "resultado.html";
    })
    .catch(error => {
        console.error('Erro ao enviar ou processar:', error);
        alert("Erro ao enviar o currículo: " + error.message);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-analise");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            analisar();
        });
    }

    if (document.getElementById("compatibilidade")) {
        const score = localStorage.getItem("compatibilidade");
        const melhorias = JSON.parse(localStorage.getItem("melhorias"));
        const presentes = JSON.parse(localStorage.getItem("presentes") || "[]");
        const faltantes = JSON.parse(localStorage.getItem("faltantes") || "[]");

        const ulPresentes = document.getElementById("lista-presentes");
        presentes.forEach(palavra => {
            const li = document.createElement("li");
            li.textContent = palavra;
            ulPresentes.appendChild(li);
        });

        const ulFaltantes = document.getElementById("lista-faltantes");
        faltantes.forEach(palavra => {
            const li = document.createElement("li");
            li.textContent = palavra;
            ulFaltantes.appendChild(li);
        });

        const ctx = document.getElementById('graficoPalavras').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Palavras Presentes', 'Palavras Faltantes'],
                datasets: [{
                    label: 'Quantidade',
                    data: [presentes.length, faltantes.length],
                    backgroundColor: ['#2ecc71', '#e74c3c'],
                    borderRadius: 8,
                    barThickness: 60,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: context => ` ${context.dataset.label}: ${context.formattedValue}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, font: { size: 14 } },
                        grid: { color: '#eee' }
                    },
                    x: {
                        ticks: { font: { size: 14 } },
                        grid: { display: false }
                    }
                }
            }
        });

        const barra = document.getElementById("progress-bar");
        barra.style.width = `${score}%`;

        if (score < 50) {
            barra.style.backgroundColor = "#e74c3c";
        } else if (score < 80) {
            barra.style.backgroundColor = "#f1c40f";
        } else {
            barra.style.backgroundColor = "#2ecc71";
        }

        document.getElementById("compatibilidade").textContent = score + "%";

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

        const sugestoesDiv = document.getElementById("sugestoes-formatadas");
        sugestoesDiv.innerHTML = "";

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

        lucide.createIcons();
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
