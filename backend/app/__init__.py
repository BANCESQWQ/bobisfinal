from flask import Flask
from flask_cors import CORS
from app.config import config
from app.database import init_db

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Habilitar CORS para Angular
    CORS(app, origins=["http://localhost:4200"])
    
    # Inicializar base de datos
    init_db(app)
    
    # Ruta de prueba
    @app.route('/')
    def hello():
        return {
            'message': 'API BOBIS - Sistema de Gestión de Bobinas',
            'version': '1.0.0',
            'status': 'Funcionando correctamente'
        }
    
    return app