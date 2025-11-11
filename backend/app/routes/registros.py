from flask import Blueprint, request, jsonify
from app.database import db
from app.models.registro import Registro
from app.models.tablas_relacionadas import Bobina, Proveedor, Barco, Ubicacion, Estado, Molino
from datetime import datetime

registros_bp = Blueprint('registros', __name__)

@registros_bp.route('/registros', methods=['GET'])
def get_registros():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        
        # Consulta base con joins para obtener nombres de relaciones
        query = db.session.query(Registro)
        
        # Aplicar filtro de búsqueda
        if search:
            query = query.filter(
                db.or_(
                    Registro.pedido_compra.ilike(f'%{search}%'),
                    Registro.colada.ilike(f'%{search}%'),
                    Registro.observaciones.ilike(f'%{search}%')
                )
            )
        
        # Paginación
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        registros = [registro.to_dict() for registro in pagination.items]
        
        return jsonify({
            'success': True,
            'data': registros,
            'pagination': {
                'total': pagination.total,
                'pages': pagination.pages,
                'page': page,
                'per_page': per_page
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@registros_bp.route('/registros/<int:registro_id>', methods=['GET'])
def get_registro(registro_id):
    try:
        registro = Registro.query.get_or_404(registro_id)
        return jsonify({
            'success': True,
            'data': registro.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404

@registros_bp.route('/registros', methods=['POST'])
def create_registro():
    try:
        data = request.get_json()
        
        # Crear nuevo registro
        registro = Registro(
            fecha_llegada=datetime.strptime(data['fecha_llegada'], '%Y-%m-%d').date() if data.get('fecha_llegada') else None,
            pedido_compra=data.get('pedido_compra'),
            colada=data.get('colada'),
            peso=data.get('peso'),
            cantidad=data.get('cantidad'),
            lote=data.get('lote'),
            fecha_inventario=datetime.strptime(data['fecha_inventario'], '%Y-%m-%d').date() if data.get('fecha_inventario') else None,
            observaciones=data.get('observaciones'),
            tcn_pedido_compra=data.get('tcn_pedido_compra'),
            fecha_ingreso_planta=datetime.strptime(data['fecha_ingreso_planta'], '%Y-%m-%d').date() if data.get('fecha_ingreso_planta') else None,
            bobina_id=data.get('bobina_id'),
            proveedor_id=data.get('proveedor_id'),
            barco_id=data.get('barco_id'),
            ubicacion_id=data.get('ubicacion_id'),
            estado_id=data.get('estado_id'),
            molino_id=data.get('molino_id')
        )
        
        db.session.add(registro)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': registro.to_dict(),
            'message': 'Registro creado exitosamente'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@registros_bp.route('/registros/<int:registro_id>', methods=['PUT'])
def update_registro(registro_id):
    try:
        registro = Registro.query.get_or_404(registro_id)
        data = request.get_json()
        
        # Actualizar campos
        if 'fecha_llegada' in data:
            registro.fecha_llegada = datetime.strptime(data['fecha_llegada'], '%Y-%m-%d').date() if data['fecha_llegada'] else None
        if 'pedido_compra' in data:
            registro.pedido_compra = data['pedido_compra']
        if 'colada' in data:
            registro.colada = data['colada']
        if 'peso' in data:
            registro.peso = data['peso']
        if 'cantidad' in data:
            registro.cantidad = data['cantidad']
        if 'lote' in data:
            registro.lote = data['lote']
        if 'fecha_inventario' in data:
            registro.fecha_inventario = datetime.strptime(data['fecha_inventario'], '%Y-%m-%d').date() if data['fecha_inventario'] else None
        if 'observaciones' in data:
            registro.observaciones = data['observaciones']
        if 'tcn_pedido_compra' in data:
            registro.tcn_pedido_compra = data['tcn_pedido_compra']
        if 'fecha_ingreso_planta' in data:
            registro.fecha_ingreso_planta = datetime.strptime(data['fecha_ingreso_planta'], '%Y-%m-%d').date() if data['fecha_ingreso_planta'] else None
        
        # Actualizar claves foráneas
        if 'bobina_id' in data:
            registro.bobina_id = data['bobina_id']
        if 'proveedor_id' in data:
            registro.proveedor_id = data['proveedor_id']
        if 'barco_id' in data:
            registro.barco_id = data['barco_id']
        if 'ubicacion_id' in data:
            registro.ubicacion_id = data['ubicacion_id']
        if 'estado_id' in data:
            registro.estado_id = data['estado_id']
        if 'molino_id' in data:
            registro.molino_id = data['molino_id']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': registro.to_dict(),
            'message': 'Registro actualizado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@registros_bp.route('/registros/<int:registro_id>', methods=['DELETE'])
def delete_registro(registro_id):
    try:
        registro = Registro.query.get_or_404(registro_id)
        
        db.session.delete(registro)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registro eliminado exitosamente'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@registros_bp.route('/registros/options', methods=['GET'])
def get_options():
    """Obtener opciones para los dropdowns"""
    try:
        bobinas = [{'id': b.id_bobi, 'nombre': b.nombre} for b in Bobina.query.all()]
        proveedores = [{'id': p.id_prov, 'nombre': p.nombre} for p in Proveedor.query.all()]
        barcos = [{'id': b.id_barco, 'nombre': b.nombre} for b in Barco.query.all()]
        ubicaciones = [{'id': u.id_ubi, 'nombre': u.nombre} for u in Ubicacion.query.all()]
        estados = [{'id': e.id_estado, 'nombre': e.nombre} for e in Estado.query.all()]
        molinos = [{'id': m.id_molino, 'nombre': m.nombre} for m in Molino.query.all()]
        
        return jsonify({
            'success': True,
            'data': {
                'bobinas': bobinas,
                'proveedores': proveedores,
                'barcos': barcos,
                'ubicaciones': ubicaciones,
                'estados': estados,
                'molinos': molinos
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500