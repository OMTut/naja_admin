from faker import Faker
from database.models.role import Role

fake = Faker()

class RoleFactory:
    
    #####################
    # Create a role data dictionary without saving to db
    #####################
    @staticmethod
    def build(**kwargs):
        defaults = {
            'role_discord_id': str(fake.random_int(min=10000000000000000, max=99999999999999999)),  # 17-18 digits
            'role_name': fake.word()[:30],  # Ensure max 30 chars (under 32 limit)
            'role_description': fake.text(max_nb_chars=200)  # Keep under 255 limit
        }
        defaults.update(kwargs)
        return defaults
    
    @staticmethod
    def create(db_session, **kwargs):
        role_data = RoleFactory.build(**kwargs)
        role = Role(**role_data)
        db_session.add(role)
        db_session.commit()
        return role
    