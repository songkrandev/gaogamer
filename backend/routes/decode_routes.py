from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required

decode_routes_bp = Blueprint('decode_routes', __name__, url_prefix='/api/game/decode')

@decode_routes_bp.route('/start', methods=['POST'])
@token_required
def start_game():
    return jsonify({'message': 'Decode game not implemented yet'}), 200
