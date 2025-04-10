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
    cursos = ['python', 'sql', 'aws', 'docker', 'excel', 'powerbi', 'javascript']
    cursos_mencionados = [p for p in palavras_chave if p in cursos]

    exemplo = (
        "Currículo Ideal para a Vaga\n\n"
        "📌 Objetivo:\n"
        "Candidatar-se à vaga de acordo com a descrição fornecida.\n\n"
        "💼 Experiência Profissional:\n"
        f"- Experiência sólida com {', '.join(palavras_chave[:3] if len(palavras_chave) >= 3 else palavras_chave)}.\n"
        f"- Projetos práticos envolvendo {', '.join(palavras_chave[3:6] if len(palavras_chave) >= 6 else palavras_chave[3:])}.\n\n"
        "🛠️ Habilidades Técnicas:\n"
        f"- {', '.join(palavras_chave[6:] if len(palavras_chave) >= 7 else palavras_chave)}.\n\n"
        "📚 Cursos e Certificações:\n"
        f"- Certificação em {', '.join(cursos_mencionados)}.\n\n"
        "📈 Resultados:\n"
        f"- Melhoria de processos em 25% através do uso de tecnologias como {', '.join(palavras_chave[:2] if len(palavras_chave) >= 2 else palavras_chave)}.\n\n"
        "📞 Contato:\n"
        "- Email: seuemail@exemplo.com\n"
        "- LinkedIn: linkedin.com/in/seuperfil"
    )

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

@app.route('/analisar', methods=['POST', 'OPTIONS'])
def analisar_curriculo():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = 'https://cv-match.netlify.app'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200

    try:
        content_type = request.headers.get('Content-Type', '')

        if 'application/json' in content_type:
            data = request.get_json()
            if not data:
                return jsonify({'erro': 'Nenhum dado JSON recebido'}), 400
            vaga = data.get('vaga', '').strip()
            texto_curriculo = data.get('curriculo_texto', '').strip()
            if not texto_curriculo:
                return jsonify({'erro': 'O texto do currículo é obrigatório'}), 400
        elif 'multipart/form-data' in content_type:
            vaga = request.form.get('vaga', '').strip()
            arquivo = request.files.get('curriculo_arquivo')
            if not arquivo or not allowed_file(arquivo.filename):
                return jsonify({'erro': 'Envie um arquivo válido (.pdf, .docx ou .txt)'}), 400
            filename = secure_filename(arquivo.filename)
            caminho = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            arquivo.save(caminho)
            texto_curriculo = extrair_texto_curriculo(caminho)
            if os.path.exists(caminho):
                os.remove(caminho)
        else:
            return jsonify({'erro': 'Formato de dados não suportado'}), 400

        if not vaga:
            return jsonify({'erro': 'A descrição da vaga é obrigatória'}), 400
        if not texto_curriculo:
            return jsonify({'erro': 'Não foi possível extrair texto do currículo'}), 400

        # Aqui definimos 'resultado' antes de usá-lo
        resultado = analisar_textos(texto_curriculo, vaga)
        modelo_ideal = gerar_modelo_ideal(resultado['presentes'] + resultado['faltantes'])
        resultado['modelo_ideal'] = modelo_ideal

        return jsonify(resultado)

    except ValueError as ve:
        return jsonify({'erro': f'Erro de validação: {str(ve)}'}), 400
    except Exception as e:
        return jsonify({'erro': f'Erro interno: {str(e)}'}), 500

@app.route('/extrair-curriculo', methods=['POST', 'OPTIONS'])
def extrair_curriculo():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = 'https://cv-match.netlify.app'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200

    try:
        arquivo = request.files.get('curriculo_arquivo')
        if not arquivo or not allowed_file(arquivo.filename):
            return jsonify({'erro': 'Envie um arquivo válido (.pdf, .docx ou .txt)'}), 400

        filename = secure_filename(arquivo.filename)
        caminho = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        arquivo.save(caminho)

        texto = extrair_texto_curriculo(caminho)
        if os.path.exists(caminho):
            os.remove(caminho)

        if not texto.strip():
            return jsonify({'erro': 'Não foi possível extrair texto do arquivo'}), 400

        return jsonify({'texto': texto.strip()})

    except Exception as e:
        return jsonify({'erro': f'Erro ao extrair texto: {str(e)}'}), 500

@app.route('/')
def home():
    return "API está rodando!"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)