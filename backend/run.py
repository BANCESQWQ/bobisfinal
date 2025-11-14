from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)

# Configuración
CORS(app, origins=['http://localhost:4200'])
app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pyodbc://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_SERVER')}/{os.getenv('DB_DATABASE')}?driver={os.getenv('DB_DRIVER')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

@app.route('/')
def hello():
    return jsonify({
        'message': 'API BOBIS - Sistema de Gestión de Bobinas',
        'version': '2.0.0',
        'database': 'bd_bobonas',
        'status': 'Funcionando correctamente'
    })

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

@app.route('/api/registros')
def get_registros():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')

        # Consulta base con JOINs para obtener información relacionada
        query = """
            SELECT 
                r.ID_REGISTRO,
                r.FECHA_LLEGADA,
                r.PEDIDO_COMPRA,
                r.COLADA,
                r.PESO,
                r.CANTIDAD,
                r.LOTE,
                r.FECHA_INVENTARIO,
                r.OBSERVACIONES,
                r.TON_PEDIDO_COMPRA,
                r.FECHA_INGRESO_PLANTA,
                r.BOBINA_ID_BOBI,
                b.DESC_BOBI as BOBINA_DESC,
                r.PROVEEDOR_ID_PROV,
                p.NOMBRE_PROV as PROVEEDOR_NOMBRE,
                r.BARCO_ID_BARCO,
                bc.NOMBRE_BARCO as BARCO_NOMBRE,
                r.UBICACION_ID_UBI,
                u.DESC_UBI as UBICACION_DESC,
                r.ESTADO_ID_ESTADO,
                e.DESC_ESTADO as ESTADO_DESC,
                r.MOLINO_ID_MOLINO,
                m.NOMBRE_MOLINO as MOLINO_NOMBRE,
                r.N_BOBI_PROVEEDOR,
                r.BOBI_CORRELATIVO
            FROM REGISTROS r
            LEFT JOIN BOBINA b ON r.BOBINA_ID_BOBI = b.ID_BOBI
            LEFT JOIN PROVEEDOR p ON r.PROVEEDOR_ID_PROV = p.ID_PROV
            LEFT JOIN BARCO bc ON r.BARCO_ID_BARCO = bc.ID_BARCO
            LEFT JOIN UBICACION u ON r.UBICACION_ID_UBI = u.ID_UBI
            LEFT JOIN ESTADO e ON r.ESTADO_ID_ESTADO = e.ID_ESTADO
            LEFT JOIN MOLINO m ON r.MOLINO_ID_MOLINO = m.ID_MOLINO
            WHERE 1=1
        """
        params = {}

        if search:
            query += " AND (r.PEDIDO_COMPRA LIKE :search OR r.COLADA LIKE :search OR r.OBSERVACIONES LIKE :search OR p.NOMBRE_PROV LIKE :search)"
            params['search'] = f"%{search}%"

        # Contar total primero
        count_query = "SELECT COUNT(*) FROM REGISTROS r WHERE 1=1"
        if search:
            count_query += " AND (r.PEDIDO_COMPRA LIKE :search OR r.COLADA LIKE :search OR r.OBSERVACIONES LIKE :search)"
        
        total = db.session.execute(text(count_query), params).scalar()
        total_pages = (total + per_page - 1) // per_page

        # Consulta con paginación
        query += " ORDER BY r.ID_REGISTRO DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
        params['offset'] = (page - 1) * per_page
        params['limit'] = per_page

        result = db.session.execute(text(query), params)
        
        registros = []
        for row in result:
            registro = {}
            for key, value in row._mapping.items():
                # Convertir tipos de datos que no son JSON serializables
                if hasattr(value, 'isoformat'):
                    registro[key.lower()] = value.isoformat()
                else:
                    registro[key.lower()] = value
            registros.append(registro)

        return jsonify({
            'success': True,
            'data': registros,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': total_pages
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/tablas')
def get_tablas():
    try:
        result = db.session.execute(text("""
            SELECT TABLE_NAME, TABLE_TYPE 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """))
        tables = [{'nombre': row[0], 'tipo': row[1]} for row in result]
        return jsonify({
            'success': True,
            'data': tables,
            'total': len(tables)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Nuevos endpoints para datos relacionados
@app.route('/api/proveedores')
def get_proveedores():
    try:
        result = db.session.execute(text("SELECT ID_PROV, NOMBRE_PROV FROM PROVEEDOR ORDER BY NOMBRE_PROV"))
        proveedores = [{'id': row[0], 'nombre': row[1]} for row in result]
        return jsonify({
            'success': True,
            'data': proveedores
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/bobinas')
def get_bobinas():
    try:
        result = db.session.execute(text("SELECT ID_BOBI, DESC_BOBI, LAM_BOBI, ESPESOR_BOBI, ANCHO_BOBI FROM BOBINA ORDER BY DESC_BOBI"))
        bobinas = [{'id': row[0], 'descripcion': row[1], 'laminacion': row[2], 'espesor': float(row[3]), 'ancho': row[4]} for row in result]
        return jsonify({
            'success': True,
            'data': bobinas
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/estados')
def get_estados():
    try:
        result = db.session.execute(text("SELECT ID_ESTADO, DESC_ESTADO FROM ESTADO ORDER BY ID_ESTADO"))
        estados = [{'id': row[0], 'descripcion': row[1]} for row in result]
        return jsonify({
            'success': True,
            'data': estados
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ubicaciones')
def get_ubicaciones():
    try:
        result = db.session.execute(text("SELECT ID_UBI, DESC_UBI FROM UBICACION ORDER BY DESC_UBI"))
        ubicaciones = [{'id': row[0], 'descripcion': row[1]} for row in result]
        return jsonify({
            'success': True,
            'data': ubicaciones
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/estadisticas')
def get_estadisticas():
    try:
        # Total registros
        total_registros = db.session.execute(text("SELECT COUNT(*) FROM REGISTROS")).scalar()
        
        # Total peso
        total_peso = db.session.execute(text("SELECT SUM(PESO) FROM REGISTROS")).scalar() or 0
        
        # Registros por estado
        estados_count = db.session.execute(text("""
            SELECT e.DESC_ESTADO, COUNT(*) as cantidad 
            FROM REGISTROS r 
            JOIN ESTADO e ON r.ESTADO_ID_ESTADO = e.ID_ESTADO 
            GROUP BY e.DESC_ESTADO
        """))
        
        estados_data = [{'estado': row[0], 'cantidad': row[1]} for row in estados_count]
        
        return jsonify({
            'success': True,
            'data': {
                'total_registros': total_registros,
                'total_peso': float(total_peso),
                'estados': estados_data
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Servidor BOBIS API iniciando...")
    print(f"📊 Base de datos: {os.getenv('DB_DATABASE')}")
    print(f"🖥️ Servidor: {os.getenv('DB_SERVER')}")
    
    # Probar conexión al inicio
    with app.app_context():
        try:
            result = db.session.execute(text('SELECT 1 as test'))
            print("✅ Conexión a la base de datos exitosa!")
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            print("🔧 Soluciones:")
            print("  1. Verifica que SQL Server esté corriendo")
            print("  2. Revisa las credenciales en .env")
            print("  3. Asegúrate de que la BD 'bd_bobonas' exista")
    
    print("🌐 Servidor listo en: http://localhost:5000")
    print("📋 Endpoints disponibles:")
    print("  - http://localhost:5000/")
    print("  - http://localhost:5000/api/test-db")
    print("  - http://localhost:5000/api/registros")
    print("  - http://localhost:5000/api/tablas")
    print("  - http://localhost:5000/api/estadisticas")
    print("  - http://localhost:5000/api/proveedores")
    print("  - http://localhost:5000/api/bobinas")
    print("  - http://localhost:5000/api/estados")
    print("  - http://localhost:5000/api/ubicaciones")
    
    app.run(debug=True, host='0.0.0.0', port=5000)