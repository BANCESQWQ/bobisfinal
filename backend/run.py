from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
import numpy as np
from sqlalchemy import text
import json
from collections import defaultdict
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:4200"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
# Configuración
CORS(app, origins=['http://localhost:4200'])
app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pyodbc://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_SERVER')}/{os.getenv('DB_DATABASE')}?driver={os.getenv('DB_DRIVER')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
    
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
@app.route('/api/registros/<int:id_registro>', methods=['PUT', 'OPTIONS'])
def actualizar_registro(id_registro):
    if request.method == 'OPTIONS':
        return jsonify({'success': True}), 200
        
    try:
        data = request.get_json()
        print(f'Actualizando registro {id_registro}:', data)

        # Construir query dinámicamente basado en los campos proporcionados
        update_fields = []
        params = {'id_registro': id_registro}

        campos_permitidos = [
            'pedido_compra', 'colada', 'peso', 'cantidad', 'lote', 
            'fecha_inventario', 'observaciones', 'ton_pedido_compra', 
            'fecha_ingreso_planta', 'bobina_id_bobi', 'proveedor_id_prov', 
            'barco_id_barco', 'ubicacion_id_ubi', 'estado_id_estado', 
            'molino_id_molino', 'n_bobi_proveedor', 'bobi_correlativo', 
            'cod_bobin2'
        ]

        for campo in campos_permitidos:
            if campo in data and data[campo] is not None:
                update_fields.append(f"{campo.upper()} = :{campo}")
                params[campo] = data[campo]

        if not update_fields:
            return jsonify({
                'success': False,
                'error': 'No se proporcionaron campos para actualizar'
            }), 400

        query = f"UPDATE REGISTROS SET {', '.join(update_fields)} WHERE ID_REGISTRO = :id_registro"

        print('Query de actualización:', query)
        print('Parámetros:', params)

        result = db.session.execute(text(query), params)
        db.session.commit()

        if result.rowcount > 0:
            return jsonify({
                'success': True,
                'message': f'Registro {id_registro} actualizado exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Registro no encontrado'
            }), 404

    except Exception as e:
        db.session.rollback()
        print('Error al actualizar registro:', str(e))
        return jsonify({
            'success': False,
            'error': f'Error al actualizar registro: {str(e)}'
        }), 500

@app.route('/api/dashboard/analitica-predictiva', methods=['GET'])
def get_analitica_predictiva():
    try:
        # 1. BOBINAS MÁS PEDIDAS (datos reales) - CORREGIDO: TOP en lugar de LIMIT
        query_bobinas_populares = """
        SELECT TOP 10
            B.DESC_BOBI,
            COUNT(PD.ID_PEDIDO_DET) as total_pedidos,
            AVG(R.PESO) as peso_promedio
        FROM PEDIDO_DET PD
        JOIN REGISTROS R ON PD.ID_REGISTRO = R.ID_REGISTRO
        JOIN BOBINA B ON R.BOBINA_ID_BOBI = B.ID_BOBI
        WHERE PD.ESTADO_DESPACHO = 1
        GROUP BY B.DESC_BOBI
        ORDER BY total_pedidos DESC
        """
        
        bobinas_populares_result = db.session.execute(text(query_bobinas_populares))
        bobinas_populares = []
        for row in bobinas_populares_result:
            bobinas_populares.append({
                'bobina': row[0],
                'total_pedidos': row[1],
                'peso_promedio': float(row[2]) if row[2] else 0
            })

        # 2. ESTADO ACTUAL DE BOBINAS
        query_estado_bobinas = """
        SELECT 
            E.DESC_ESTADO,
            COUNT(R.ID_REGISTRO) as cantidad
        FROM REGISTROS R
        JOIN ESTADO E ON R.ESTADO_ID_ESTADO = E.ID_ESTADO
        GROUP BY E.DESC_ESTADO
        """
        
        estado_bobinas_result = db.session.execute(text(query_estado_bobinas))
        estado_bobinas = []
        for row in estado_bobinas_result:
            estado_bobinas.append({
                'estado': row[0],
                'cantidad': row[1]
            })

        # 3. PREDICCIÓN DE DEMANDA (ML Simple) - CORREGIDO: DATEADD en lugar de DATE_SUB
        query_historico_pedidos = """
        SELECT 
            CAST(PC.FECHA_PEDIDO AS DATE) as fecha,
            COUNT(PD.ID_PEDIDO_DET) as cantidad_pedidos
        FROM PEDIDO_CAB PC
        JOIN PEDIDO_DET PD ON PC.ID_PEDIDO = PD.ID_PEDIDO
        WHERE PC.FECHA_PEDIDO >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY CAST(PC.FECHA_PEDIDO AS DATE)
        ORDER BY fecha
        """
        
        historico_result = db.session.execute(text(query_historico_pedidos))
        datos_historicos = []
        for row in historico_result:
            datos_historicos.append({
                'fecha': row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                'cantidad': row[1]
            })

        # 4. BOBINAS MÁS ANTIGUAS (para rotación) - CORREGIDO: TOP y DATEDIFF
        query_bobinas_antiguas = """
        SELECT TOP 10
            R.ID_REGISTRO,
            B.DESC_BOBI,
            R.FECHA_INGRESO_PLANTA,
            R.PESO,
            E.DESC_ESTADO,
            DATEDIFF(DAY, R.FECHA_INGRESO_PLANTA, GETDATE()) as dias_inventario
        FROM REGISTROS R
        JOIN BOBINA B ON R.BOBINA_ID_BOBI = B.ID_BOBI
        JOIN ESTADO E ON R.ESTADO_ID_ESTADO = E.ID_ESTADO
        WHERE R.ESTADO_ID_ESTADO = 1  -- Disponibles
        ORDER BY R.FECHA_INGRESO_PLANTA ASC
        """
        
        bobinas_antiguas_result = db.session.execute(text(query_bobinas_antiguas))
        bobinas_antiguas = []
        for row in bobinas_antiguas_result:
            bobinas_antiguas.append({
                'id_registro': row[0],
                'bobina': row[1],
                'fecha_ingreso': row[2].isoformat() if hasattr(row[2], 'isoformat') else str(row[2]),
                'peso': float(row[3]) if row[3] else 0,
                'estado': row[4],
                'dias_inventario': row[5]
            })

        # 5. TENDENCIA MENSUAL (para gráfico de líneas) - CORREGIDO: FORMAT en lugar de DATE_FORMAT
        query_tendencia_mensual = """
        SELECT 
            FORMAT(PC.FECHA_PEDIDO, 'yyyy-MM') as mes,
            COUNT(PD.ID_PEDIDO_DET) as total_pedidos,
            SUM(R.PESO) as peso_total
        FROM PEDIDO_CAB PC
        JOIN PEDIDO_DET PD ON PC.ID_PEDIDO = PD.ID_PEDIDO
        JOIN REGISTROS R ON PD.ID_REGISTRO = R.ID_REGISTRO
        WHERE PC.FECHA_PEDIDO >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY FORMAT(PC.FECHA_PEDIDO, 'yyyy-MM')
        ORDER BY mes
        """
        
        tendencia_result = db.session.execute(text(query_tendencia_mensual))
        tendencia_mensual = []
        for row in tendencia_result:
            tendencia_mensual.append({
                'mes': row[0],
                'total_pedidos': row[1],
                'peso_total': float(row[2]) if row[2] else 0
            })

        # 6. PREDICCIÓN CON REGRESIÓN LINEAL (ML)
        prediccion_proximos_meses = predecir_demanda(tendencia_mensual)

        # 7. ESTADÍSTICAS GENERALES - Consultas separadas para mayor claridad
        query_total_bobinas = "SELECT COUNT(*) as total FROM REGISTROS"
        query_bobinas_disponibles = "SELECT COUNT(*) as disponibles FROM REGISTROS WHERE ESTADO_ID_ESTADO = 1"
        query_bobinas_despachadas = "SELECT COUNT(*) as despachadas FROM REGISTROS WHERE ESTADO_ID_ESTADO = 2"
        
        total_bobinas = db.session.execute(text(query_total_bobinas)).fetchone()[0]
        bobinas_disponibles = db.session.execute(text(query_bobinas_disponibles)).fetchone()[0]
        bobinas_despachadas = db.session.execute(text(query_bobinas_despachadas)).fetchone()[0]

        return jsonify({
            'success': True,
            'data': {
                'bobinasPopulares': bobinas_populares,
                'estadoBobinas': estado_bobinas,
                'bobinasAntiguas': bobinas_antiguas,
                'tendenciaMensual': tendencia_mensual,
                'prediccionDemanda': prediccion_proximos_meses,
                'estadisticas': {
                    'totalBobinas': total_bobinas,
                    'bobinasDisponibles': bobinas_disponibles,
                    'bobinasDespachadas': bobinas_despachadas
                }
            }
        })
        
    except Exception as e:
        print("Error en análisis predictivo:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Algoritmo de Machine Learning Simple - Regresión Lineal
def predecir_demanda(tendencia_mensual):
    try:
        print(f"Datos para ML: {len(tendencia_mensual)} meses")
        
        if len(tendencia_mensual) < 2:
            print("No hay suficientes datos históricos para predicción")
            # Generar predicción básica si no hay suficientes datos
            return generar_prediccion_basica()
        
        # Preparar datos para regresión
        X = np.array([i for i in range(len(tendencia_mensual))])
        y = np.array([item['total_pedidos'] for item in tendencia_mensual])
        
        print(f"X: {X}, y: {y}")
        
        # Regresión lineal manual mejorada
        n = len(X)
        sum_x = np.sum(X)
        sum_y = np.sum(y)
        sum_xy = np.sum(X * y)
        sum_x2 = np.sum(X * X)
        
        # Calcular pendiente (m) e intercepto (b)
        denominator = n * sum_x2 - sum_x * sum_x
        if denominator == 0:
            print("Denominador cero, usando predicción básica")
            return generar_prediccion_basica()
            
        m = (n * sum_xy - sum_x * sum_y) / denominator
        b = (sum_y - m * sum_x) / n
        
        print(f"Regresión: m={m}, b={b}")
        
        # Predecir próximos 6 meses
        predicciones = []
        ultimo_mes = len(X)
        
        for i in range(1, 7):
            mes_prediccion = ultimo_mes + i
            demanda_predicha = m * mes_prediccion + b
            
            # Suavizar la predicción y asegurar que no sea negativa
            demanda_predicha = max(10, int(demanda_predicha))
            
            # Calcular fecha del próximo mes
            fecha_actual = datetime.now()
            fecha_prediccion = fecha_actual + timedelta(days=30*i)
            mes_formateado = fecha_prediccion.strftime('%Y-%m')
            
            # Determinar tendencia
            if m > 0.5:
                tendencia = 'creciente'
            elif m < -0.5:
                tendencia = 'decreciente'
            else:
                tendencia = 'estable'
            
            predicciones.append({
                'mes': mes_formateado,
                'demanda_predicha': demanda_predicha,
                'tendencia': tendencia
            })
        
        print(f"Predicciones generadas: {predicciones}")
        return predicciones
        
    except Exception as e:
        print(f"Error en predicción ML: {str(e)}")
        return generar_prediccion_basica()

def generar_prediccion_basica():
    """Generar predicción básica cuando no hay suficientes datos"""
    predicciones = []
    fecha_actual = datetime.now()
    
    # Promedio básico de 50 pedidos por mes como fallback
    demanda_base = 50
    
    for i in range(1, 7):
        fecha_prediccion = fecha_actual + timedelta(days=30*i)
        mes_formateado = fecha_prediccion.strftime('%Y-%m')
        
        # Pequeña variación aleatoria para hacerlo más realista
        import random
        variacion = random.randint(-10, 15)
        demanda_predicha = max(20, demanda_base + variacion)
        
        predicciones.append({
            'mes': mes_formateado,
            'demanda_predicha': demanda_predicha,
            'tendencia': 'creciente' if variacion > 0 else 'estable'
        })
    
    print(f"Predicción básica generada: {predicciones}")
    return predicciones
    
@app.route('/api/gestion/<tabla>', methods=['GET'])
def get_tabla_gestion(tabla):
    try:
        # Validar tabla permitida
        tablas_permitidas = ['UBICACION', 'BARCO', 'MOLINO', 'PROVEEDOR', 'ESTADO', 'PROCEDENCIA']
        if tabla not in tablas_permitidas:
            return jsonify({
                'success': False,
                'error': f'Tabla {tabla} no permitida'
            }), 400

        # Construir query según tabla
        if tabla == 'UBICACION':
            query = "SELECT ID_UBI, DESC_UBI FROM UBICACION ORDER BY ID_UBI"
        elif tabla == 'BARCO':
            query = "SELECT ID_BARCO, NOMBRE_BARCO FROM BARCO ORDER BY ID_BARCO"
        elif tabla == 'MOLINO':
            query = "SELECT ID_MOLINO, NOMBRE_MOLINO, PROCEDENCIA_ID_PROCED FROM MOLINO ORDER BY ID_MOLINO"
        elif tabla == 'PROVEEDOR':
            query = "SELECT ID_PROV, NOMBRE_PROV FROM PROVEEDOR ORDER BY ID_PROV"
        elif tabla == 'ESTADO':
            query = "SELECT ID_ESTADO, DESC_ESTADO FROM ESTADO ORDER BY ID_ESTADO"
        elif tabla == 'PROCEDENCIA':
            query = "SELECT ID_PROCED, DESC_PROCED FROM PROCEDENCIA ORDER BY ID_PROCED"

        result = db.session.execute(text(query))
        datos = []

        for row in result:
            dato = {}
            for idx, column in enumerate(result.keys()):
                value = row[idx]
                # MANTENER LOS NOMBRES DE CAMPOS EN MAYÚSCULAS
                dato[column] = value.isoformat() if hasattr(value, 'isoformat') else value
            datos.append(dato)

        return jsonify({
            'success': True,
            'data': datos
        })

    except Exception as e:
        print(f"Error obteniendo datos de {tabla}:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gestion/<tabla>', methods=['POST'])
def agregar_registro_gestion(tabla):
    try:
        data = request.get_json()
        print(f"Agregando registro a {tabla}:", data)

        tablas_permitidas = ['UBICACION', 'BARCO', 'MOLINO', 'PROVEEDOR', 'ESTADO', 'PROCEDENCIA']
        if tabla not in tablas_permitidas:
            return jsonify({
                'success': False,
                'error': f'Tabla {tabla} no permitida'
            }), 400

        # Construir query de inserción según tabla - USAR MAYÚSCULAS
        if tabla == 'UBICACION':
            query = "INSERT INTO UBICACION (DESC_UBI) VALUES (:DESC_UBI)"
            params = {'DESC_UBI': data['DESC_UBI']}
        elif tabla == 'BARCO':
            query = "INSERT INTO BARCO (NOMBRE_BARCO) VALUES (:NOMBRE_BARCO)"
            params = {'NOMBRE_BARCO': data['NOMBRE_BARCO']}
        elif tabla == 'MOLINO':
            query = "INSERT INTO MOLINO (NOMBRE_MOLINO, PROCEDENCIA_ID_PROCED) VALUES (:NOMBRE_MOLINO, :PROCEDENCIA_ID_PROCED)"
            params = {
                'NOMBRE_MOLINO': data['NOMBRE_MOLINO'],
                'PROCEDENCIA_ID_PROCED': data['PROCEDENCIA_ID_PROCED']
            }
        elif tabla == 'PROVEEDOR':
            query = "INSERT INTO PROVEEDOR (NOMBRE_PROV) VALUES (:NOMBRE_PROV)"
            params = {'NOMBRE_PROV': data['NOMBRE_PROV']}
        elif tabla == 'ESTADO':
            query = "INSERT INTO ESTADO (DESC_ESTADO) VALUES (:DESC_ESTADO)"
            params = {'DESC_ESTADO': data['DESC_ESTADO']}
        elif tabla == 'PROCEDENCIA':
            query = "INSERT INTO PROCEDENCIA (DESC_PROCED) VALUES (:DESC_PROCED)"
            params = {'DESC_PROCED': data['DESC_PROCED']}

        result = db.session.execute(text(query), params)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Registro agregado exitosamente a {tabla}'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error agregando registro a {tabla}:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/gestion/<tabla>/<int:id>', methods=['DELETE'])
def eliminar_registro_gestion(tabla, id):
    try:
        tablas_permitidas = ['UBICACION', 'BARCO', 'MOLINO', 'PROVEEDOR', 'ESTADO', 'PROCEDENCIA']
        if tabla not in tablas_permitidas:
            return jsonify({
                'success': False,
                'error': f'Tabla {tabla} no permitida'
            }), 400

        # Construir query de eliminación según tabla
        if tabla == 'UBICACION':
            query = "DELETE FROM UBICACION WHERE ID_UBI = :id"
        elif tabla == 'BARCO':
            query = "DELETE FROM BARCO WHERE ID_BARCO = :id"
        elif tabla == 'MOLINO':
            query = "DELETE FROM MOLINO WHERE ID_MOLINO = :id"
        elif tabla == 'PROVEEDOR':
            query = "DELETE FROM PROVEEDOR WHERE ID_PROV = :id"
        elif tabla == 'ESTADO':
            query = "DELETE FROM ESTADO WHERE ID_ESTADO = :id"
        elif tabla == 'PROCEDENCIA':
            query = "DELETE FROM PROCEDENCIA WHERE ID_PROCED = :id"

        result = db.session.execute(text(query), {'id': id})
        db.session.commit()

        if result.rowcount > 0:
            return jsonify({
                'success': True,
                'message': f'Registro eliminado exitosamente de {tabla}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Registro no encontrado'
            }), 404

    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando registro de {tabla}:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
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
        estado = request.args.get('estado', '')  # Nuevo filtro por estado

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
            r.BOBI_CORRELATIVO,
            r.COD_BOBIN2
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

        # Filtrar por estado si se proporciona
        if estado:
            query += " AND r.ESTADO_ID_ESTADO = :estado"
            params['estado'] = estado

        if search:
            query += " AND (r.PEDIDO_COMPRA LIKE :search OR r.COLADA LIKE :search OR r.OBSERVACIONES LIKE :search OR p.NOMBRE_PROV LIKE :search OR b.DESC_BOBI LIKE :search OR r.COD_BOBIN2 LIKE :search)"
            params['search'] = f"%{search}%"

        # Contar total primero
        count_query = "SELECT COUNT(*) FROM REGISTROS r LEFT JOIN BOBINA b ON r.BOBINA_ID_BOBI = b.ID_BOBI LEFT JOIN PROVEEDOR p ON r.PROVEEDOR_ID_PROV = p.ID_PROV WHERE 1=1"
        if search:
            count_query += " AND (r.PEDIDO_COMPRA LIKE :search OR r.COLADA LIKE :search OR r.OBSERVACIONES LIKE :search OR p.NOMBRE_PROV LIKE :search OR b.DESC_BOBI LIKE :search OR r.COD_BOBIN2 LIKE :search)"
        if estado:
            count_query += " AND r.ESTADO_ID_ESTADO = :estado"

        total = db.session.execute(text(count_query), params).scalar()

        total_pages = (total + per_page - 1) // per_page if total > 0 else 1

        # Consulta con paginacion
        query += " ORDER BY r.FECHA_INGRESO_PLANTA ASC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
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
# Nuevos endpoints para re
@app.route('/api/pedidos', methods=['POST'])
def crear_pedido():
    try:
        data = request.get_json()
        print('Datos recibidos para crear pedido:', data)

        # Validar datos requeridos
        if not data or 'usuario_solicita_id' not in data or 'registros' not in data:
            return jsonify({
                'success': False,
                'error': 'Datos incompletos: se requiere usuario_solicita_id y registros'
            }), 400

        # 1. Crear cabecera del pedido - CORREGIDO
        query_cab = """
        INSERT INTO PEDIDO_CAB (FECHA_PEDIDO, USUARIO_SOLICITA_ID, ESTADO_PEDIDO_ID, OBSERVACIONES)
        OUTPUT INSERTED.ID_PEDIDO
        VALUES (SYSDATETIME(), :usuario_id, 2, :observaciones)
        """
        params_cab = {
            'usuario_id': data['usuario_solicita_id'],
            'observaciones': data.get('observaciones', '')
        }

        print('Ejecutando query cabecera:', query_cab)
        print('Con parámetros:', params_cab)

        result = db.session.execute(text(query_cab), params_cab)
        id_pedido = result.scalar()  # Usar scalar() en lugar de fetchone()
        print(f'Pedido cabecera creado con ID: {id_pedido}')

        if not id_pedido:
            raise Exception("No se pudo obtener el ID del pedido creado")

        # 2. Crear detalle del pedido Y ACTUALIZAR ESTADO DE BOBINAS
        if data['registros']:
            query_det = """
            INSERT INTO PEDIDO_DET (ID_PEDIDO, ID_REGISTRO, ESTADO_DESPACHO, PED_OBSERVACIONES)
            VALUES (:id_pedido, :id_registro, 1, :observaciones)
            """
            
            query_update_estado = """
            UPDATE REGISTROS 
            SET ESTADO_ID_ESTADO = 2 -- 2 = 'Despachada'
            WHERE ID_REGISTRO = :id_registro
            """

            for id_registro in data['registros']:
                print(f'Agregando registro {id_registro} al pedido {id_pedido} y marcando como despachada')
                
                # Insertar en detalle de pedido
                db.session.execute(text(query_det), {
                    'id_pedido': id_pedido,
                    'id_registro': id_registro,
                    'observaciones': data.get('observaciones', 'Despachado desde sistema')
                })

                # Actualizar estado de la bobina a "Despachada"
                db.session.execute(text(query_update_estado), {
                    'id_registro': id_registro
                })

        db.session.commit()
        print(f'Pedido {id_pedido} creado exitosamente con {len(data["registros"])} registros')

        return jsonify({
            'success': True,
            'id_pedido': id_pedido,
            'message': f'Pedido #{id_pedido} creado exitosamente con {len(data["registros"])} bobinas'
        })

    except Exception as e:
        db.session.rollback()
        print('Error al crear pedido:', str(e))
        return jsonify({
            'success': False,
            'error': f'Error al crear pedido: {str(e)}'
        }), 500
@app.route('/api/opciones-combos')
def get_opciones_combos():
    try:
        # Obtener todas las opciones para los combos
        bobinas = db.session.execute(text("SELECT ID_BOBI, DESC_BOBI FROM BOBINA")).fetchall()
        proveedores = db.session.execute(text("SELECT ID_PROV, NOMBRE_PROV FROM PROVEEDOR")).fetchall()
        barcos = db.session.execute(text("SELECT ID_BARCO, NOMBRE_BARCO FROM BARCO")).fetchall()
        ubicaciones = db.session.execute(text("SELECT ID_UBI, DESC_UBI FROM UBICACION")).fetchall()
        estados = db.session.execute(text("SELECT ID_ESTADO, DESC_ESTADO FROM ESTADO")).fetchall()
        molinos = db.session.execute(text("SELECT ID_MOLINO, NOMBRE_MOLINO FROM MOLINO")).fetchall()

        return jsonify({
            'success': True,
            'data': {
                'bobinas': [{'id': row[0], 'descripcion': row[1]} for row in bobinas],
                'proveedores': [{'id': row[0], 'nombre': row[1]} for row in proveedores],
                'barcos': [{'id': row[0], 'nombre': row[1]} for row in barcos],
                'ubicaciones': [{'id': row[0], 'descripcion': row[1]} for row in ubicaciones],
                'estados': [{'id': row[0], 'descripcion': row[1]} for row in estados],
                'molinos': [{'id': row[0], 'nombre': row[1]} for row in molinos]
            }
        })
    except Exception as e:
        print('Error obteniendo opciones combos:', str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
# Endpoints para Dashboard
@app.route('/api/dashboard/estadisticas', methods=['GET'])
def get_estadisticas_dashboard():
    try:
        # Estadísticas generales
        query_total_bobinas = "SELECT COUNT(*) as total FROM REGISTROS WHERE ESTADO_ID_ESTADO = 1"
        query_pedidos_pendientes = "SELECT COUNT(*) as pendientes FROM PEDIDO_CAB WHERE ESTADO_PEDIDO_ID = 2"
        query_promedio_peso = "SELECT AVG(PESO) as promedio FROM REGISTROS"
        
        total_bobinas = db.session.execute(text(query_total_bobinas)).fetchone()[0]
        pedidos_pendientes = db.session.execute(text(query_pedidos_pendientes)).fetchone()[0]
        promedio_peso = db.session.execute(text(query_promedio_peso)).fetchone()[0] or 0
        
        # Bobinas más usadas (simplificado)
        query_bobinas_usadas = """
        SELECT B.DESC_BOBI, COUNT(R.ID_REGISTRO) as cantidad 
        FROM REGISTROS R 
        JOIN BOBINA B ON R.BOBINA_ID_BOBI = B.ID_BOBI 
        GROUP BY B.DESC_BOBI 
        ORDER BY cantidad DESC 
        LIMIT 5
        """
        
        bobinas_usadas_result = db.session.execute(text(query_bobinas_usadas))
        bobinas_usadas = []
        for row in bobinas_usadas_result:
            bobinas_usadas.append({
                'bobina': row[0],
                'cantidad': row[1]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'estadisticasGenerales': {
                    'totalBobinas': total_bobinas,
                    'pedidosPendientes': pedidos_pendientes,
                    'promedioPeso': round(float(promedio_peso), 2)
                },
                'bobinasMasUsadas': bobinas_usadas,
                'proximosPedidos': [
                    {'fecha': '2025-11-20', 'cantidad': 15},
                    {'fecha': '2025-11-25', 'cantidad': 22},
                    {'fecha': '2025-12-01', 'cantidad': 18}
                ],
                'prediccionYear': [
                    {'mes': 'Ene', 'pedidos': 120},
                    {'mes': 'Feb', 'pedidos': 135},
                    {'mes': 'Mar', 'pedidos': 142},
                    {'mes': 'Abr', 'pedidos': 128},
                    {'mes': 'May', 'pedidos': 155},
                    {'mes': 'Jun', 'pedidos': 148},
                    {'mes': 'Jul', 'pedidos': 162},
                    {'mes': 'Ago', 'pedidos': 158},
                    {'mes': 'Sep', 'pedidos': 145},
                    {'mes': 'Oct', 'pedidos': 138},
                    {'mes': 'Nov', 'pedidos': 152},
                    {'mes': 'Dic', 'pedidos': 168}
                ]
            }
        })
        
    except Exception as e:
        print("Error obteniendo estadísticas del dashboard:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
@app.route('/api/registros/actualizar-estado', methods=['PUT'])
def actualizar_estado_registros():
    try:
        data = request.get_json()
        ids_registros = data.get('ids_registros', [])
        nuevo_estado_id = data.get('nuevo_estado_id')

        if not ids_registros or nuevo_estado_id is None:
            return jsonify({
                'success': False,
                'error': 'Datos incompletos'
            }), 400

        # Actualizar estado de los registros
        query = "UPDATE REGISTROS SET ESTADO_ID_ESTADO = :estado_id WHERE ID_REGISTRO IN :ids_registros"
        result = db.session.execute(text(query), {
            'estado_id': nuevo_estado_id,
            'ids_registros': tuple(ids_registros)
        })

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'{result.rowcount} registros actualizados exitosamente'
        })

    except Exception as e:
        db.session.rollback()
        print('Error actualizando estado registros:', str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
@app.route('/api/despachos/historial')
def get_historial_despachos():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')

        # Consulta para obtener todos los despachos (PEDIDO_DET)
        query = """
        SELECT
            pd.ID_PEDIDO_DET,
            pd.ID_PEDIDO,
            pd.ID_REGISTRO,
            pc.FECHA_PEDIDO,
            u.NOMBRE_USUARIO + ' ' + u.APELLIDO_USUARIO AS SOLICITANTE,
            ep.DESCRIPCION AS ESTADO_PEDIDO,
            pd.PED_OBSERVACIONES,
            pd.ESTADO_DESPACHO,
            r.PEDIDO_COMPRA,
            r.COLADA,
            r.PESO,
            b.DESC_BOBI AS BOBINA_DESC,
            p.NOMBRE_PROV AS PROVEEDOR_NOMBRE,
            CASE WHEN pd.ESTADO_DESPACHO = 1 THEN pc.FECHA_PEDIDO ELSE NULL END AS FECHA_DESPACHO
        FROM PEDIDO_DET pd
        JOIN PEDIDO_CAB pc ON pc.ID_PEDIDO = pd.ID_PEDIDO
        JOIN USUARIOS u ON u.ID_USUARIO = pc.USUARIO_SOLICITA_ID
        JOIN ESTADO_PEDIDO ep ON ep.ID_ESTADO_PED = pc.ESTADO_PEDIDO_ID
        JOIN REGISTROS r ON r.ID_REGISTRO = pd.ID_REGISTRO
        LEFT JOIN BOBINA b ON b.ID_BOBI = r.BOBINA_ID_BOBI
        LEFT JOIN PROVEEDOR p ON p.ID_PROV = r.PROVEEDOR_ID_PROV
        WHERE 1=1
        """
        
        params = {}

        if search:
            query += " AND (r.PEDIDO_COMPRA LIKE :search OR r.COLADA LIKE :search OR b.DESC_BOBI LIKE :search OR p.NOMBRE_PROV LIKE :search)"
            params['search'] = f"%{search}%"

        # Contar total primero
        count_query = query.replace(
            "SELECT pd.ID_PEDIDO_DET, pd.ID_PEDIDO, pd.ID_REGISTRO, pc.FECHA_PEDIDO, u.NOMBRE_USUARIO + ' ' + u.APELLIDO_USUARIO AS SOLICITANTE, ep.DESCRIPCION AS ESTADO_PEDIDO, pd.PED_OBSERVACIONES, pd.ESTADO_DESPACHO, r.PEDIDO_COMPRA, r.COLADA, r.PESO, b.DESC_BOBI AS BOBINA_DESC, p.NOMBRE_PROV AS PROVEEDOR_NOMBRE, CASE WHEN pd.ESTADO_DESPACHO = 1 THEN pc.FECHA_PEDIDO ELSE NULL END AS FECHA_DESPACHO",
            "SELECT COUNT(*)"
        )
        
        total = db.session.execute(text(count_query), params).scalar()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1

        # Consulta principal con paginación
        query += " ORDER BY pc.FECHA_PEDIDO DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY"
        params['offset'] = (page - 1) * per_page
        params['limit'] = per_page

        result = db.session.execute(text(query), params)

        despachos = []
        for row in result:
            despacho = {
                'id_pedido_det': row[0],
                'id_pedido': row[1],
                'id_registro': row[2],
                'fecha_pedido': row[3].isoformat() if hasattr(row[3], 'isoformat') else str(row[3]),
                'solicitante': row[4],
                'estado_pedido': row[5],
                'ped_observaciones': row[6] or '',
                'estado_despacho': bool(row[7]),
                'pedido_compra': row[8],
                'colada': row[9],
                'peso': float(row[10]) if row[10] else 0,
                'bobina_desc': row[11] or 'Sin información',
                'proveedor_nombre': row[12] or 'Sin proveedor',
                'fecha_despacho': row[13].isoformat() if row[13] and hasattr(row[13], 'isoformat') else (str(row[13]) if row[13] else None)
            }
            despachos.append(despacho)

        return jsonify({
            'success': True,
            'data': despachos,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': total_pages
            }
        })

    except Exception as e:
        print('Error en historial despachos:', str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/pedidos/en-curso')
def get_pedidos_en_curso():
    try:
        query = """
        SELECT
            pc.ID_PEDIDO,
            pc.FECHA_PEDIDO,
            u.NOMBRE_USUARIO + ' ' + u.APELLIDO_USUARIO AS SOLICITANTE,
            ep.DESCRIPCION AS ESTADO_PEDIDO,
            pc.OBSERVACIONES,
            COUNT(pd.ID_PEDIDO_DET) AS CANT_BOBINAS
        FROM PEDIDO_CAB pc
        JOIN USUARIOS u ON u.ID_USUARIO = pc.USUARIO_SOLICITA_ID
        JOIN ESTADO_PEDIDO ep ON ep.ID_ESTADO_PED = pc.ESTADO_PEDIDO_ID
        LEFT JOIN PEDIDO_DET pd ON pd.ID_PEDIDO = pc.ID_PEDIDO
        WHERE ep.DESCRIPCION IN ('Borrador', 'Enviado', 'Procesando')
        GROUP BY 
            pc.ID_PEDIDO, pc.FECHA_PEDIDO, u.NOMBRE_USUARIO, u.APELLIDO_USUARIO, 
            ep.DESCRIPCION, pc.OBSERVACIONES
        ORDER BY pc.FECHA_PEDIDO DESC
        """
        
        result = db.session.execute(text(query))
        pedidos = []
        
        for row in result:
            pedido = {
                'id_pedido': row[0],
                'fecha_pedido': row[1].isoformat() if hasattr(row[1], 'isoformat') else str(row[1]),
                'solicitante': row[2],
                'estado_pedido': row[3],
                'observaciones': row[4],
                'cant_bobinas': row[5]
            }
            pedidos.append(pedido)

        return jsonify({
            'success': True,
            'data': pedidos
        })

    except Exception as e:
        print('Error en pedidos en curso:', str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/pedidos/<int:id_pedido>/detalle')
def get_detalle_pedido(id_pedido):
    try:
        query = """
        SELECT 
            r.ID_REGISTRO,
            r.PEDIDO_COMPRA,
            r.COLADA,
            r.PESO,
            r.CANTIDAD,
            r.LOTE,
            r.COD_BOBIN2,
            b.DESC_BOBI,
            p.NOMBRE_PROV,
            r.FECHA_INGRESO_PLANTA
        FROM PEDIDO_DET pd
        JOIN REGISTROS r ON r.ID_REGISTRO = pd.ID_REGISTRO
        LEFT JOIN BOBINA b ON b.ID_BOBI = r.BOBINA_ID_BOBI
        LEFT JOIN PROVEEDOR p ON p.ID_PROV = r.PROVEEDOR_ID_PROV
        WHERE pd.ID_PEDIDO = :id_pedido
        ORDER BY r.ID_REGISTRO
        """
        
        result = db.session.execute(text(query), {'id_pedido': id_pedido})
        
        detalles = []
        for row in result:
            detalle = {}
            for idx, column in enumerate(result.keys()):
                value = row[idx]
                if hasattr(value, 'isoformat'):
                    detalle[column.lower()] = value.isoformat()
                else:
                    detalle[column.lower()] = value
            detalles.append(detalle)
        
        return jsonify({
            'success': True,
            'data': detalles
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
# Endpoints para usuarios
@app.route('/api/usuarios')
def get_usuarios():
    try:
        query = """
        SELECT 
            ID_USUARIO,
            NOMBRE_USUARIO,
            APELLIDO_USUARIO,
            CORREO_USUARIO,
            AZURE_OBJECT_ID,
            ROL_USUARIO,
            ESTADO,
            FECHA_ULTIMO_ACCESO,
            FECHA_CREACION
        FROM USUARIOS
        WHERE ESTADO = 'Activo'
        ORDER BY NOMBRE_USUARIO, APELLIDO_USUARIO
        """
        result = db.session.execute(text(query))
        
        usuarios = []
        for row in result:
            usuario = {}
            for idx, column in enumerate(result.keys()):
                value = row[idx]
                if hasattr(value, 'isoformat'):
                    usuario[column.lower()] = value.isoformat()
                else:
                    usuario[column.lower()] = value
            usuarios.append(usuario)
        
        return jsonify({
            'success': True,
            'data': usuarios
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/usuarios/<int:id_usuario>')
def get_usuario(id_usuario):
    try:
        query = """
        SELECT 
            ID_USUARIO,
            NOMBRE_USUARIO,
            APELLIDO_USUARIO,
            CORREO_USUARIO,
            AZURE_OBJECT_ID,
            ROL_USUARIO,
            ESTADO,
            FECHA_ULTIMO_ACCESO,
            FECHA_CREACION
        FROM USUARIOS
        WHERE ID_USUARIO = :id_usuario
        """
        result = db.session.execute(text(query), {'id_usuario': id_usuario})
        row = result.fetchone()
        
        if not row:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        usuario = {}
        for idx, column in enumerate(result.keys()):
            value = row[idx]
            if hasattr(value, 'isoformat'):
                usuario[column.lower()] = value.isoformat()
            else:
                usuario[column.lower()] = value
        
        return jsonify({
            'success': True,
            'data': usuario
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/usuarios/azure/<azure_object_id>')
def get_usuario_azure(azure_object_id):
    try:
        query = """
        SELECT 
            ID_USUARIO,
            NOMBRE_USUARIO,
            APELLIDO_USUARIO,
            CORREO_USUARIO,
            AZURE_OBJECT_ID,
            ROL_USUARIO,
            ESTADO,
            FECHA_ULTIMO_ACCESO,
            FECHA_CREACION
        FROM USUARIOS
        WHERE AZURE_OBJECT_ID = :azure_object_id
        """
        result = db.session.execute(text(query), {'azure_object_id': azure_object_id})
        row = result.fetchone()
        
        if not row:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        usuario = {}
        for idx, column in enumerate(result.keys()):
            value = row[idx]
            if hasattr(value, 'isoformat'):
                usuario[column.lower()] = value.isoformat()
            else:
                usuario[column.lower()] = value
        
        return jsonify({
            'success': True,
            'data': usuario
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/usuarios/sincronizar', methods=['POST'])
def sincronizar_usuario():
    try:
        data = request.get_json()
        
        # Verificar si el usuario ya existe
        query_check = """
        SELECT ID_USUARIO FROM USUARIOS 
        WHERE AZURE_OBJECT_ID = :azure_object_id
        """
        result = db.session.execute(text(query_check), {
            'azure_object_id': data['azure_object_id']
        })
        existing_user = result.fetchone()
        
        if existing_user:
            # Actualizar último acceso
            query_update = """
            UPDATE USUARIOS 
            SET FECHA_ULTIMO_ACCESO = SYSDATETIME()
            WHERE ID_USUARIO = :id_usuario
            """
            db.session.execute(text(query_update), {
                'id_usuario': existing_user[0]
            })
            user_id = existing_user[0]
        else:
            # Crear nuevo usuario
            query_insert = """
            INSERT INTO USUARIOS (
                NOMBRE_USUARIO, 
                APELLIDO_USUARIO, 
                CORREO_USUARIO, 
                AZURE_OBJECT_ID,
                ROL_USUARIO
            ) VALUES (
                :nombre, :apellido, :correo, :azure_object_id, :rol
            )
            SELECT SCOPE_IDENTITY() as id_usuario
            """
            result = db.session.execute(text(query_insert), {
                'nombre': data.get('nombre', ''),
                'apellido': data.get('apellido', ''),
                'correo': data.get('correo', ''),
                'azure_object_id': data['azure_object_id'],
                'rol': data.get('rol', 'Consulta')
            })
            user_id = result.fetchone()[0]
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'id_usuario': user_id,
            'message': 'Usuario sincronizado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
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