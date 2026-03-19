from config import Config
from utils.json_db import JSONDatabase

# Initialize database instances
admins_db = JSONDatabase(Config.ADMINS_FILE)
senior_users_db = JSONDatabase(Config.SENIOR_USERS_FILE)
game_sessions_db = JSONDatabase(Config.GAME_SESSIONS_FILE)
game_scores_db = JSONDatabase(Config.GAME_SCORES_FILE)

class AdminModel:
    """Admin user model"""
    
    @staticmethod
    def get_all():
        return admins_db.get_all('admins')
    
    @staticmethod
    def get_by_id(admin_id):
        return admins_db.get_by_id('admins', admin_id, 'admin_id')
    
    @staticmethod
    def get_by_email(email):
        admins = AdminModel.get_all()
        for admin in admins:
            if admin.get('email') == email:
                return admin
        return None
    
    @staticmethod
    def create(admin_data):
        admins_db.add('admins', admin_data)
        return admin_data
    
    @staticmethod
    def update(admin_id, admin_data):
        return admins_db.update('admins', admin_id, admin_data, 'admin_id')
    
    @staticmethod
    def delete(admin_id):
        return admins_db.delete('admins', admin_id, 'admin_id')
