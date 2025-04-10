function analisar() {
    // Captura o conteúdo da vaga e do currículo
    const vaga = document.getElementById("vaga").value.trim();
    const curriculo = document.getElementById("curriculo").value.trim();

    // Adicionando logs para depuração
    console.log("Vaga:", vaga); // Verificando o conteúdo da vaga
    console.log("Currículo:", curriculo); // Verificando o conteúdo do currículo

    // Verificação para garantir que ambos os campos estão preenchidos
    if (!vaga || !curriculo) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Montagem do payload
    const payload = {
        vaga: vaga,
        curriculo_texto: curriculo
    };

    // Envio da requisição para o backend
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
    const uploadInput = document.getElementById("file-upload");
    const campoCurriculo = document.getElementById("curriculo");

    // 🆕 Upload de currículo
    if (uploadInput && campoCurriculo) {
        uploadInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("curriculo_arquivo", file); // <- aqui o nome certo


            try {
                const response = await fetch("https://analisador-de-curr-culos.onrender.com/extrair-curriculo", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();

                if (data.texto) {
                    campoCurriculo.value = data.texto;
                } else {
                    alert("Não foi possível extrair o texto do currículo.");
                }
            } catch (error) {
                console.error("Erro ao processar o arquivo:", error);
                alert("Erro ao processar o currículo.");
            }
        });
    }

    // 🧠 Submissão do formulário
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault(); // impede o envio tradicional
            analisar(); // Chama a função que analisa os dados
        });
    }

    // 🔁 Tela de resultado
    if (document.getElementById("compatibilidade")) {
        // ... (mantém o mesmo código atual da tela de resultados)
        // pode deixar exatamente como já está aqui, está funcional e completo
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
