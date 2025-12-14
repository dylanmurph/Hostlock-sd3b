from Server import create_app  # Make sure you import the app correctly
from Server.models import db, User, AccessLog, TamperAlert  # Assuming models are defined here
from datetime import datetime, timedelta
import os
from os.path import join, getmtime

# Directories for image storage
TAMPER_IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'tampers')
ACCESS_LOG_IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
PROFILE_IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'profile_images')

# Initialize app
app = create_app()  # Assuming `create_app()` is a function that returns your Flask app

def delete_old_files(directory, cutoff_date):
    if not os.path.exists(directory):
        print(f"Directory does not exist: {directory}")
        return  # Exit the function if the directory doesn't exist
    for filename in os.listdir(directory):
        file_path = join(directory, filename)
        if os.path.isfile(file_path):
            file_mod_time = datetime.fromtimestamp(getmtime(file_path))
            if file_mod_time < cutoff_date:
                os.remove(file_path)
                print(f"Deleted old file: {file_path}")

def cleanup_old_data():
    cutoff_date = datetime.now() - timedelta(days=30)

    # Push application context
    with app.app_context():
        # Update the query to use 'last_login_at' for users
        old_users = User.query.filter(User.last_login_at < cutoff_date).all()
        for user in old_users:
            db.session.delete(user)
        print(f"Deleted {len(old_users)} old users.")

        # Update the query to use 'time_logged' for access logs
        old_access_logs = AccessLog.query.filter(AccessLog.time_logged < cutoff_date).all()
        for log in old_access_logs:
            db.session.delete(log)
        print(f"Deleted {len(old_access_logs)} old access logs.")

        # Update the query to use 'triggered_at' for tamper alerts
        old_tamper_alerts = TamperAlert.query.filter(TamperAlert.triggered_at < cutoff_date).all()
        for alert in old_tamper_alerts:
            db.session.delete(alert)
        print(f"Deleted {len(old_tamper_alerts)} old tamper alerts.")

        # Commit the changes to the database
        db.session.commit()
        print("Database cleanup completed.")

def main_cleanup():
    cutoff_date = datetime.now() - timedelta(days=30)

    delete_old_files(TAMPER_IMAGES_DIR, cutoff_date)
    delete_old_files(ACCESS_LOG_IMAGES_DIR, cutoff_date)
    delete_old_files(PROFILE_IMAGES_DIR, cutoff_date)

    cleanup_old_data()

if __name__ == "__main__":
    main_cleanup()