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
        window.location.href = "resultado.html";
    })
    .catch(error => {
        console.error('Erro ao enviar ou processar:', error);
        alert("Erro ao enviar o currículo: " + error.message);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Carregar dados do localStorage
    const compatibilidade = localStorage.getItem("compatibilidade");
    const melhorias = JSON.parse(localStorage.getItem("melhorias"));
    const presentes = JSON.parse(localStorage.getItem("presentes"));
    const faltantes = JSON.parse(localStorage.getItem("faltantes"));
    const modeloIdeal = localStorage.getItem("modelo_ideal");

    // Atualizar a compatibilidade
    if (compatibilidade) {
        document.getElementById("compatibilidade").innerText = `${compatibilidade}%`;
        document.getElementById("progress-bar").style.width = `${compatibilidade}%`;
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
