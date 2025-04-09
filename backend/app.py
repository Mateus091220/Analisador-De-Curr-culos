from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet, stopwords
import string
import os
from docx import Document
import PyPDF2

# Inicializações
app = Flask(__name__)
CORS(app, origins=["https://cv-match.netlify.app"])

@app.before_request
def log_headers():
    print("🔥 Origin:", request.headers.get('Origin'))
    print("🔥 Headers:", dict(request.headers))

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Baixar recursos NLTK
for resource in ['punkt', 'wordnet', 'omw-1.4', 'stopwords']:
    try:
        nltk.data.find(f'tokenizers/{resource}' if resource == 'punkt' else f'corpora/{resource}')
    except LookupError:
        nltk.download(resource)

stop_words = set(stopwords.words('portuguese'))
pontuacoes = set(string.punctuation)

def allowed_file(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def extrair_texto_curriculo(caminho):
    try:
        if caminho.endswith('.pdf'):
            with open(caminho, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                return "\n".join([page.extract_text() or "" for page in reader.pages])
        elif caminho.endswith('.docx'):
            doc = Document(caminho)
            return "\n".join([p.text for p in doc.paragraphs])
        elif caminho.endswith('.txt'):
            with open(caminho, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            return ""
    except Exception as e:
        print(f"[ERRO] Erro ao extrair texto: {e}")
        return ""

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name().lower().replace('_', ' '))
    return synonyms

def adicionar_melhoria(lista, prioridade, mensagem):
    if not any(m['mensagem'] == mensagem for m in lista):
        lista.append({"prioridade": prioridade, "mensagem": mensagem})

def gerar_modelo_ideal(palavras_chave):
    exemplo = f"""
Currículo Ideal para a Vaga

📌 Objetivo:
Candidatar-se à vaga de acordo com a descrição fornecida.

💼 Experiência Profissional:
- Experiência sólida com {', '.join(palavras_chave[:3])}.
- Projetos práticos envolvendo {', '.join(palavras_chave[3:6])}.

🛠️ Habilidades Técnicas:
- {', '.join(palavras_chave[6:])}

📚 Cursos e Certificações:
- Certificação em {', '.join([p for p in palavras_chave if p in ['python', 'sql', 'aws', 'docker', 'excel', 'powerbi', 'javascript']])}.

📈 Resultados:
- Melhoria de processos em 25% através do uso de tecnologias como {', '.join(palavras_chave[:2])}.

📞 Contato:
- Email: seuemail@exemplo.com
- LinkedIn: linkedin.com/in/seuperfil
"""
    return exemplo.strip()

def analisar_textos(curriculo, vaga):
    vaga = vaga.lower()
    curriculo = curriculo.lower()

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

    return {
        'score': score,
        'melhorias': melhorias,
        'presentes': list(set(palavras_presentes)),
        'faltantes': palavras_faltantes
    }

@app.route('/analisar', methods=['POST'])
def analisar_curriculo():
    try:
        vaga = request.form.get('vaga', '')
        arquivo = request.files.get('curriculo_arquivo')

        if not vaga.strip():
            return jsonify({'erro': 'A descrição da vaga é obrigatória'}), 400
        if not arquivo or not allowed_file(arquivo.filename):
            return jsonify({'erro': 'Envie um arquivo válido (.pdf, .docx ou .txt)'}), 400

        filename = secure_filename(arquivo.filename)
        caminho = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        arquivo.save(caminho)

        texto_curriculo = extrair_texto_curriculo(caminho)
        if not texto_curriculo.strip():
            return jsonify({'erro': 'Não foi possível extrair texto do arquivo'}), 400

        resultado = analisar_textos(texto_curriculo, vaga)
        modelo_ideal = gerar_modelo_ideal(resultado['presentes'] + resultado['faltantes'])
        resultado['modelo_ideal'] = modelo_ideal
        return jsonify(resultado)

    except Exception as e:
        return jsonify({'erro': f'Erro interno: {str(e)}'}), 500

@app.route('/')
def home():
    return "API está rodando!"

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)