import spacy

# Carrega o modelo de NLP (use 'en_core_web_sm' para inglês ou 'pt_core_news_sm' para português)
nlp = spacy.load("pt_core_news_sm")

def analisar_curriculo(vaga, curriculo):
    doc_vaga = nlp(vaga.lower())  
    doc_curriculo = nlp(curriculo.lower())

    # Extrai palavras-chave (substantivos, verbos e adjetivos)
    palavras_chave = {token.text for token in doc_vaga if token.pos_ in ["NOUN", "VERB", "ADJ"]}
    palavras_curriculo = {token.text for token in doc_curriculo}

    # Calcula compatibilidade (baseado nas palavras-chave presentes no currículo)
    match = palavras_chave & palavras_curriculo
    score = round((len(match) / len(palavras_chave)) * 100) if palavras_chave else 0

    # Gera sugestões
    palavras_faltantes = palavras_chave - palavras_curriculo
    sugestoes = [
        f"🔴 Adicione a palavra-chave: '{palavra}'" for palavra in palavras_faltantes
    ] if palavras_faltantes else ["🟢 Seu currículo cobre bem os requisitos da vaga!"]

    return {
        "compatibilidade": score,
        "sugestoes": sugestoes
    }
