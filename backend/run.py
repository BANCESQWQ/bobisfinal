import os
import sys
from flask import Flask, jsonify, request
from sqlalchemy import text  # ¡IMPORTANTE agregar esto!

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from app.database import db
from app.config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Habilitar CORS
CORS(app, origins=["http://localhost:4200"])

# Inicializar base de datos
db.init_app(app)

@app.route('/')
def hello():
    return {
        'message': 'API BOBIS - Sistema de Gestión de Bobinas',
        'version': '1.0.0',
        'status': 'Funcionando correctamente'
    }

@app.route('/api/test-db')
def test_db():
    try:
        result = db.session.execute(text('SELECT 1 as test'))
        return jsonify({
            'success': True,
            'message': '✅ Conexión a la base de datos exitosa!',
            'database': os.getenv('DB_DATABASE')
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tablas')
def get_tablas():
    try:
        # Listar tablas disponibles
        result = db.session.execute(text("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        """))
        tablas = [row[0] for row in result]
        return {
            'success': True,
            'data': tablas,
            'message': f'Se encontraron {len(tablas)} tablas'
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500

@app.route('/api/registros')
def get_registros():
    try:
        # Consulta con text()
        result = db.session.execute(text('SELECT TOP 10 * FROM REGISTROS'))
        registros = []
        for row in result:
            # Convertir a diccionario
            registro_dict = {}
            for key, value in row._mapping.items():
                # Convertir tipos de datos que no son JSON serializables
                if hasattr(value, 'isoformat'):
                    registro_dict[key] = value.isoformat()
                else:
                    registro_dict[key] = value
            registros.append(registro_dict)
        
        return {
            'success': True,
            'data': registros,
            'total': len(registros)
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask...")
    print(f"📊 Conectando a: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[1].split('?')[0]}")
    
    # Probar conexión a la base de datos CORREGIDA
    with app.app_context():
        try:
            # USAR text() aquí también
            result = db.session.execute(text('SELECT 1 as test'))
            print("✅ Conexión a la base de datos exitosa!")
        except Exception as e:
            print(f"❌ Error conectando a la base de datos: {e}")
            print("💡 Verifica:")
            print("   - Que SQL Server esté corriendo")
            print("   - Las credenciales en el archivo .env")
            print("   - Que la base de datos 'bd_bobinas' exista")
    
    print("📡 Servidor corriendo en: http://localhost:5000")
    print("🌐 Endpoints disponibles:")
    print("   - http://localhost:5000/")
    print("   - http://localhost:5000/test-db")
    print("   - http://localhost:5000/api/tablas") 
    print("   - http://localhost:5000/api/registros")
    
    app.run(debug=True, host='0.0.0.0', port=5000)