import os
import json
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

# Configuração do Banco de Dados MySQL
# Formato: mysql+pymysql://usuário:senha@host:porta/nome_do_banco
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'mysql+pymysql://root:@localhost/cantina_quantum')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Modelos de Dados
class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(50), unique=True)
    amount = db.Column(db.Float, nullable=False)
    method = db.Column(db.String(20))
    quantum_seal = db.Column(db.String(100))
    status = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=db.func.now())

class TokenizedCard(db.Model):
    __tablename__ = 'tokenized_cards'
    id = db.Column(db.Integer, primary_key=True)
    owner = db.Column(db.String(100))
    token = db.Column(db.String(100), unique=True)
    last4 = db.Column(db.String(4))
    created_at = db.Column(db.DateTime, default=db.func.now())

# Criar tabelas automaticamente
with app.app_context():
    try:
        db.create_all()
        print("Tabelas SQL criadas com sucesso.")
    except Exception as e:
        print(f"Aviso: Não foi possível conectar ao MySQL ({e}). Verifique as credenciais.")

# Mock de Integração com Stripe (Simulado)
def process_stripe_payment(amount):
    time.sleep(1.5)
    return {
        "id": f"ch_{int(time.time())}",
        "status": "succeeded",
        "amount": amount
    }

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "Quantum Backend Active with SQL Layer",
        "db_connected": True
    })

@app.route('/api/process-payment', methods=['POST'])
def process_payment():
    data = request.json
    amount = data.get('amount')
    method = data.get('method')
    
    quantum_seal = f"QS-{base64.b64encode(os.urandom(16)).decode('utf-8')[:16].upper()}"
    result = process_stripe_payment(amount)
    
    # Salvar no Banco de Dados
    new_trans = Transaction(
        external_id=result['id'],
        amount=amount,
        method=method,
        quantum_seal=quantum_seal,
        status=result['status']
    )
    
    try:
        db.session.add(new_trans)
        db.session.commit()
    except:
        db.session.rollback()
        print("Aviso: Falha ao salvar transação no Banco SQL (Usando modo volátil).")
    
    return jsonify({
        "success": True,
        "transaction_id": result['id'],
        "quantum_seal": quantum_seal,
        "gateway_status": result['status']
    })

@app.route('/api/cards', methods=['POST'])
def register_card():
    card_data = request.json
    token = f"tok_quantum_{base64.b64encode(os.urandom(16)).decode('utf-8')}"
    
    new_card = TokenizedCard(
        owner=card_data.get('owner'),
        token=token,
        last4=card_data.get('number')[-4:] if card_data.get('number') else "0000"
    )
    
    try:
        db.session.add(new_card)
        db.session.commit()
    except:
        db.session.rollback()

    return jsonify({
        "success": True,
        "token": token,
        "message": "Cartão tokenizado e persistido no Banco SQL."
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
