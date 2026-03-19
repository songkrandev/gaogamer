from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required

wheel_routes_bp = Blueprint('wheel_routes', __name__, url_prefix='/api/game/wheel')

@wheel_routes_bp.route('/start', methods=['POST'])
@token_required
def start_game():
    return jsonify({'message': 'Wheel game not implemented yet'}), 200
