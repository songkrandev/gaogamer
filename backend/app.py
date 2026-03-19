from flask import Flask, jsonify
from flask_cors import CORS
from config import config
import os

# Create Flask app
def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Enable CORS for all routes and allow common headers
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.traffic_routes import traffic_routes_bp
    from routes.catch_routes import catch_routes_bp
    from routes.wheel_routes import wheel_routes_bp
    from routes.decode_routes import decode_routes_bp
    from routes.puzzle_routes import puzzle_routes_bp
    from routes.common_routes import common_routes_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(traffic_routes_bp)
    app.register_blueprint(catch_routes_bp)
    app.register_blueprint(wheel_routes_bp)
    app.register_blueprint(decode_routes_bp)
    app.register_blueprint(puzzle_routes_bp)
    app.register_blueprint(common_routes_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Server is running'}), 200
    
    # 404 handler
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Endpoint not found'}), 404
    
    # 500 handler
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
