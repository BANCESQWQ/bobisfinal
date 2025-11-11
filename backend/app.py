from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# SOLUCIÓN: Configuración CORS ÚNICA y SIMPLE
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    
    if origin and origin in ['http://localhost:4200', 'http://127.0.0.1:4200']:
        response.headers.add('Access-Control-Allow-Origin', origin)
    
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Manejar preflight OPTIONS requests
@app.route('/api/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

# Configuración de la base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pyodbc://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_SERVER')}/{os.getenv('DB_DATABASE')}?driver={os.getenv('DB_DRIVER')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

@app.route('/')
def hello():
    return jsonify({
        'message': 'API BOBIS - Sistema de Gestión de Bobinas',
        'version': '1.0.0',
        'status': '✅ Funcionando con CORS corregido'
    })

@app.route('/api/test-db')
def test_db():
    try:
        result = db.session.execute(text('SELECT 1 as test'))
        return jsonify({
            'success': True,
            'message': '✅ Conexión a SQL Server exitosa!',
            'database': os.getenv('DB_DATABASE')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/registros')
def get_registros():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        offset = (page - 1) * per_page
        
        # Consulta base
        query = "SELECT * FROM REGISTROS WHERE 1=1"
        params = {}
        
        if search:
            query += " AND (PEDIDO_COMPRA LIKE :search OR COLADA LIKE :search OR OBSERVACIONES LIKE :search)"
            params['search'] = f'%{search}%'
        
        # Consulta para los datos
        data_query = query + " ORDER BY ID_REGISTRO OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
        params['offset'] = offset
        params['limit'] = per_page
        
        result = db.session.execute(text(data_query), params)
        
        registros = []
        for row in result:
            registro = {}
            for key, value in row._mapping.items():
                if hasattr(value, 'isoformat'):
                    registro[key.lower()] = value.isoformat()
                else:
                    registro[key.lower()] = value
            registros.append(registro)
        
        # Contar total
        count_query = "SELECT COUNT(*) as total FROM REGISTROS WHERE 1=1"
        if search:
            count_query += " AND (PEDIDO_COMPRA LIKE :search OR COLADA LIKE :search OR OBSERVACIONES LIKE :search)"
        
        total_result = db.session.execute(text(count_query), params).first()
        total = total_result[0] if total_result else 0
        
        return jsonify({
            'success': True,
            'data': registros,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/registros/<int:registro_id>', methods=['PUT'])
def update_registro(registro_id):
    try:
        data = request.get_json()
        print(f"📝 Actualizando registro {registro_id}:", data)
        
        # Solo actualizar campos simples para probar
        update_fields = []
        params = {'id': registro_id}
        
        if 'pedido_compra' in data:
            update_fields.append("PEDIDO_COMPRA = :pedido_compra")
            params['pedido_compra'] = data['pedido_compra']
            
        if 'colada' in data:
            update_fields.append("COLADA = :colada")
            params['colada'] = data['colada']
            
        if 'observaciones' in data:
            update_fields.append("OBSERVACIONES = :observaciones")
            params['observaciones'] = data['observaciones']
            
        if 'peso' in data:
            update_fields.append("PESO = :peso")
            params['peso'] = float(data['peso']) if data['peso'] else None
            
        if 'cantidad' in data:
            update_fields.append("CANTIDAD = :cantidad")
            params['cantidad'] = int(data['cantidad']) if data['cantidad'] else None
        
        if not update_fields:
            return jsonify({
                'success': False,
                'error': 'No hay campos para actualizar'
            }), 400
        
        update_query = f"UPDATE REGISTROS SET {', '.join(update_fields)} WHERE ID_REGISTRO = :id"
        print(f"🔧 Query: {update_query}")
        
        result = db.session.execute(text(update_query), params)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registro actualizado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Servidor BOBIS API (CORS Corregido) iniciando...")
    print("🔧 Configuración CORS simplificada")
    
    with app.app_context():
        try:
            result = db.session.execute(text('SELECT 1 as test'))
            print("✅ Conexión a la base de datos exitosa!")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
    
    print("📡 Servidor listo en: http://localhost:5000")
    print("🌐 CORS configurado para: http://localhost:4200")
    
    app.run(debug=True, host='0.0.0.0', port=5000)