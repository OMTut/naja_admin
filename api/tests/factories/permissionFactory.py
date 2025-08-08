from faker import Faker
from database.models.permission import Permission

fake = Faker()

class PermissionFactory:
    
    #####################
    # Create a permission data dictionary without saving to db
    #####################
    @staticmethod
    def build(**kwargs):
        defaults = {
            'permission_name': fake.word()[:30],  # Ensure max 30 chars (under 32 limit)
            'permission_description': fake.text(max_nb_chars=200)  # Keep under 255 limit
        }
        defaults.update(kwargs)
        return defaults
    
    @staticmethod
    def create(db_session, **kwargs):
        permission_data = PermissionFactory.build(**kwargs)
        permission = Permission(**permission_data)
        db_session.add(permission)
        db_session.commit()
        return permission