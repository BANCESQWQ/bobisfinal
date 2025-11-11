import os
import sys

# Agregar el directorio actual al path de Python
sys.path.append(os.path.dirname(__file__))

try:
    from app.database import db
    from app.config import Config
    from flask import Flask
    
    print("✅ Módulos importados correctamente!")
    
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    
    with app.app_context():
        try:
            result = db.session.execute('SELECT 1 as test')
            print("✅ Conexión a SQL Server exitosa!")
        except Exception as e:
            print(f"❌ Error de conexión a BD: {e}")
            
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("Estructura actual:")
    for root, dirs, files in os.walk('.'):
        level = root.replace('.', '').count(os.sep)
        indent = ' ' * 2 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 2 * (level + 1)
        for file in files:
            if file.endswith('.py'):
                print(f'{subindent}{file}')