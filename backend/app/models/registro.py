from app.database import db
from datetime import datetime

class Registro(db.Model):
    __tablename__ = 'REGISTROS'
    
    id_registro = db.Column('ID_REGISTRO', db.Integer, primary_key=True)
    fecha_llegada = db.Column('FECHA_LLEGADA', db.Date, nullable=True)
    pedido_compra = db.Column('PEDIDO_COMPRA', db.String(30), nullable=True)
    colada = db.Column('COLADA', db.String(20), nullable=True)
    peso = db.Column('PESO', db.Numeric(18, 3), nullable=True)
    cantidad = db.Column('CANTIDAD', db.Integer, nullable=True)
    lote = db.Column('LOTE', db.Integer, nullable=True)
    fecha_inventario = db.Column('FECHA_INVENTARIO', db.Date, nullable=True)
    observaciones = db.Column('OBSERVACIONES', db.String(150), nullable=True)
    tcn_pedido_compra = db.Column('TCN_PEDIDO_COMPRA', db.Numeric(18, 3), nullable=True)
    fecha_ingreso_planta = db.Column('FECHA_INGRESO_PLANTA', db.Date, nullable=True)
    
    # Claves foráneas
    bobina_id = db.Column('BOBINA_ID_BOBI', db.Integer, db.ForeignKey('BOBINA.ID_BOBI'), nullable=True)
    proveedor_id = db.Column('PROVEEDOR_ID_PROV', db.Integer, db.ForeignKey('PROVEEDOR.ID_PROV'), nullable=True)
    barco_id = db.Column('BARCO_ID_BARCO', db.Integer, db.ForeignKey('BARCO.ID_BARCO'), nullable=True)
    ubicacion_id = db.Column('UBICACION_ID_UBI', db.Integer, db.ForeignKey('UBICACION.ID_UBI'), nullable=True)
    estado_id = db.Column('ESTADO_ID_ESTADO', db.Integer, db.ForeignKey('ESTADO.ID_ESTADO'), nullable=True)
    molino_id = db.Column('MOLINO_ID_MOLINO', db.Integer, db.ForeignKey('MOLINO.ID_MOLINO'), nullable=True)
    
    # Relaciones (opcionales, para eager loading)
    bobina = db.relationship('Bobina', backref='registros')
    proveedor = db.relationship('Proveedor', backref='registros')
    barco = db.relationship('Barco', backref='registros')
    ubicacion = db.relationship('Ubicacion', backref='registros')
    estado = db.relationship('Estado', backref='registros')
    molino = db.relationship('Molino', backref='registros')
    
    def to_dict(self):
        return {
            'id_registro': self.id_registro,
            'fecha_llegada': self.fecha_llegada.isoformat() if self.fecha_llegada else None,
            'pedido_compra': self.pedido_compra,
            'colada': self.colada,
            'peso': float(self.peso) if self.peso else None,
            'cantidad': self.cantidad,
            'lote': self.lote,
            'fecha_inventario': self.fecha_inventario.isoformat() if self.fecha_inventario else None,
            'observaciones': self.observaciones,
            'tcn_pedido_compra': float(self.tcn_pedido_compra) if self.tcn_pedido_compra else None,
            'fecha_ingreso_planta': self.fecha_ingreso_planta.isoformat() if self.fecha_ingreso_planta else None,
            'bobina_id': self.bobina_id,
            'proveedor_id': self.proveedor_id,
            'barco_id': self.barco_id,
            'ubicacion_id': self.ubicacion_id,
            'estado_id': self.estado_id,
            'molino_id': self.molino_id,
            # Información de las relaciones (si están cargadas)
            'bobina_nombre': self.bobina.nombre if self.bobina else None,
            'proveedor_nombre': self.proveedor.nombre if self.proveedor else None,
            'barco_nombre': self.barco.nombre if self.barco else None,
            'ubicacion_nombre': self.ubicacion.nombre if self.ubicacion else None,
            'estado_nombre': self.estado.nombre if self.estado else None,
            'molino_nombre': self.molino.nombre if self.molino else None
        }
    
    def __repr__(self):
        return f'<Registro {self.id_registro} - {self.pedido_compra}>'