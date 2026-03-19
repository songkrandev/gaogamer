from flask import Blueprint, request, jsonify
from middleware.auth_middleware import token_required

puzzle_routes_bp = Blueprint('puzzle_routes', __name__, url_prefix='/api/game/puzzle')

@puzzle_routes_bp.route('/start', methods=['POST'])
@token_required
def start_game():
    return jsonify({'message': 'Puzzle game not implemented yet'}), 200
