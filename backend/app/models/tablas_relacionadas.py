from app.database import db

class Bobina(db.Model):
    __tablename__ = 'BOBINA'
    id_bobi = db.Column('ID_BOBI', db.Integer, primary_key=True)
    nombre = db.Column('NOMBRE', db.String(100), nullable=True)
    # Agrega más campos según tu tabla BOBINA

class Proveedor(db.Model):
    __tablename__ = 'PROVEEDOR'
    id_prov = db.Column('ID_PROV', db.Integer, primary_key=True)
    nombre = db.Column('NOMBRE', db.String(100), nullable=True)
    # Agrega más campos según tu tabla PROVEEDOR

class Barco(db.Model):
    __tablename__ = 'BARCO'
    id_barco = db.Column('ID_BARCO', db.Integer, primary_key=True)
    nombre = db.Column('NOMBRE', db.String(100), nullable=True)
    # Agrega más campos según tu tabla BARCO

class Ubicacion(db.Model):
    __tablename__ = 'UBICACION'
    id_ubi = db.Column('ID_UBI', db.Integer, primary_key=True)
    nombre = db.Column('NOMBRE', db.String(100), nullable=True)
    # Agrega más campos según tu tabla UBICACION

class Estado(db.Model):
    __tablename__ = 'ESTADO'
    id_estado = db.Column('ID_ESTADO', db.Integer, primary_key=True)
    nombre = db.Column('NOMBRE', db.String(100), nullable=True)
    # Agrega más campos según tu tabla ESTADO

class Molino(db.Model):
    __tablename__ = 'MOLINO'
    id_molino = db.Column('ID_MOLINO', db.Integer, primary_key=True)
    nombre = db.Column('NOMBRE', db.String(100), nullable=True)
    # Agrega más campos según tu tabla MOLINO