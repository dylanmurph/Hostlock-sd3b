import os
import time
from datetime import datetime, timedelta
from os.path import join, getmtime
from .models import db, User, AccessLog, TamperAlert

TAMPER_IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'access_logs', 'tampers')
ACCESS_LOG_IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'access_logs')
PROFILE_IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'profile_images')

def delete_old_files(directory, cutoff_date):
    for filename in os.listdir(directory):
        file_path = join(directory, filename)
        if os.path.isfile(file_path):
            file_mod_time = datetime.fromtimestamp(getmtime(file_path))
            if file_mod_time < cutoff_date:
                os.remove(file_path)
                print(f"Deleted old file: {file_path}")

def cleanup_old_data():
    cutoff_date = datetime.now() - timedelta(days=30)

    old_users = User.query.filter(User.last_active < cutoff_date).all()
    for user in old_users:
        db.session.delete(user)
    print(f"Deleted {len(old_users)} old users.")

    old_access_logs = AccessLog.query.filter(AccessLog.timestamp < cutoff_date).all()
    for log in old_access_logs:
        db.session.delete(log)
    print(f"Deleted {len(old_access_logs)} old access logs.")

    old_tamper_alerts = TamperAlert.query.filter(TamperAlert.timestamp < cutoff_date).all()
    for alert in old_tamper_alerts:
        db.session.delete(alert)
    print(f"Deleted {len(old_tamper_alerts)} old tamper alerts.")

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
