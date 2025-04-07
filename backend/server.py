from flask import Flask, request, jsonify
from flask_cors import CORS
import analisador_nlp  # Importa nosso script de NLP

app = Flask(__name__)
CORS(app)  # Permite que o frontend se comunique com o backend

@app.route('/analisar', methods=['POST'])
def analisar():
    dados = request.json
    vaga = dados.get("vaga", "").strip()
    curriculo = dados.get("curriculo", "").strip()

    if not vaga or not curriculo:
        return jsonify({"erro": "Preencha todos os campos!"}), 400

    resultado = analisador_nlp.analisar_curriculo(vaga, curriculo)
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(debug=True)
