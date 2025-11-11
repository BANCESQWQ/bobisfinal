from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    
    # Opcional: Crear tablas si no existen (para desarrollo)
    with app.app_context():
        try:
            # Esto intentará crear las tablas basadas en los modelos
            # Por ahora no hacemos nada, solo inicializamos la conexión
            print("✅ Base de datos inicializada correctamente")
        except Exception as e:
            print(f"⚠️  Nota: {e}")