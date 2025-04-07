from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet, stopwords
import string

# Baixar recursos apenas se ainda não estiverem disponíveis
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    nltk.data.find('corpora/omw-1.4')
except LookupError:
    nltk.download('omw-1.4')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Carregar stopwords para o idioma português
stop_words = set(stopwords.words('portuguese'))
pontuacoes = set(string.punctuation)

app = Flask(__name__)
CORS(app)

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name().lower().replace('_', ' '))
    return synonyms

def adicionar_melhoria(lista, prioridade, mensagem):
    if not any(m['mensagem'] == mensagem for m in lista):
        lista.append({"prioridade": prioridade, "mensagem": mensagem})

@app.route('/analisar', methods=['POST'])
def analisar_curriculo():
    dados = request.get_json()
    vaga = dados.get('vaga', '').lower()
    curriculo = dados.get('curriculo', '').lower()

    if not vaga or not curriculo:
        return jsonify({'erro': 'Campos vaga e currículo são obrigatórios.'}), 400

    # Tokeniza e remove stopwords e pontuação
    palavras_vaga = list(set([
        word for word in word_tokenize(vaga, preserve_line=True)
        if word not in stop_words and word not in pontuacoes
    ]))

    palavras_curriculo = [
        word for word in word_tokenize(curriculo, preserve_line=True)
        if word not in stop_words and word not in pontuacoes
    ]

    correspondencias = 0
    total = len(palavras_vaga)
    palavras_faltantes = []
    palavras_presentes = []
    melhorias = []

    for palavra in palavras_vaga:
        if palavra in palavras_curriculo:
            correspondencias += 1
            palavras_presentes.append(palavra)
        else:
            sinonimos = get_synonyms(palavra)
            if any(s in palavras_curriculo for s in sinonimos):
                correspondencias += 0.5
                palavras_presentes.append(palavra + " (sinônimo)")
            else:
                palavras_faltantes.append(palavra)

    score = int(min(100, (correspondencias / total) * 100)) if total else 0

    # Sugestões de melhoria
    if palavras_faltantes:
        sugestao_palavras = ", ".join(palavras_faltantes[:5])
        adicionar_melhoria(melhorias, "Essencial", f"Você pode adicionar palavras como: {sugestao_palavras}")

    cursos_sugeridos = [palavra for palavra in palavras_faltantes if palavra in [
        "python", "sql", "aws", "docker", "excel", "powerbi", "javascript"
    ]]
    for curso in cursos_sugeridos:
        adicionar_melhoria(melhorias, "Importante", f"Considere realizar ou mencionar o curso: {curso}")

    if score < 50:
        adicionar_melhoria(melhorias, "Essencial", "Tente incluir mais palavras-chave relacionadas à vaga.")
        adicionar_melhoria(melhorias, "Importante", "Adicione mais detalhes sobre suas experiências e habilidades específicas.")
        adicionar_melhoria(melhorias, "Opcional", "Certifique-se de que seu currículo está atualizado e bem estruturado.")
    elif score < 80:
        adicionar_melhoria(melhorias, "Importante", "Seu currículo está bom, mas pode ser aprimorado.")
        adicionar_melhoria(melhorias, "Importante", "Tente adicionar certificações ou cursos relevantes para a vaga.")
        adicionar_melhoria(melhorias, "Opcional", "Destaque suas conquistas e resultados em empregos anteriores.")
    else:
        adicionar_melhoria(melhorias, "Opcional", "Ótimo currículo! Apenas revise detalhes.")
        adicionar_melhoria(melhorias, "Opcional", "Tente personalizar o currículo para cada vaga.")
        adicionar_melhoria(melhorias, "Opcional", "Verifique a formatação para manter um visual profissional.")

    return jsonify({
        'score': score,
        'melhorias': melhorias,
        'presentes': list(set(palavras_presentes)),
        'faltantes': palavras_faltantes
    })

@app.route('/')
def home():
    return "API está rodando!"

if __name__ == '__main__':
    app.run(debug=True)
