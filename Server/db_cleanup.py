import os
import signal
from datetime import datetime, timedelta
from os.path import join, getmtime
from Server import create_app
from Server.models import db, User, AccessLog, TamperAlert

# Directories for image storage
TAMPER_IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'uploads', 'tampers')
ACCESS_LOG_IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
PROFILE_IMAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads', 'profile_images')

app = create_app()

def delete_old_files(directory, cutoff_date):
    """Deletes files older than the cutoff date from a given directory."""
    if not os.path.exists(directory):
        print(f"Directory does not exist: {directory}")
        return
    for filename in os.listdir(directory):
        file_path = join(directory, filename)
        if os.path.isfile(file_path):
            file_mod_time = datetime.fromtimestamp(getmtime(file_path))
            if file_mod_time < cutoff_date:
                os.remove(file_path)
                print(f"Deleted old file: {file_path}")

def cleanup_old_data():
    """Deletes old users, access logs, and tamper alerts older than 30 days."""
    cutoff_date = datetime.now() - timedelta(days=30)

    with app.app_context():
        # Delete old users
        old_users = User.query.filter(User.last_login_at < cutoff_date).all()
        for user in old_users:
            db.session.delete(user)
        print(f"Deleted {len(old_users)} old users.")

        # Delete old access logs
        old_access_logs = AccessLog.query.filter(AccessLog.time_logged < cutoff_date).all()
        for log in old_access_logs:
            db.session.delete(log)
        print(f"Deleted {len(old_access_logs)} old access logs.")

        # Delete old tamper alerts
        old_tamper_alerts = TamperAlert.query.filter(TamperAlert.triggered_at < cutoff_date).all()
        for alert in old_tamper_alerts:
            db.session.delete(alert)
        print(f"Deleted {len(old_tamper_alerts)} old tamper alerts.")

        db.session.commit()
        print("Database cleanup completed.")

def main_cleanup():
    """Main cleanup function to delete old files and data."""
    cutoff_date = datetime.now() - timedelta(days=30)

    delete_old_files(TAMPER_IMAGES_DIR, cutoff_date)
    delete_old_files(ACCESS_LOG_IMAGES_DIR, cutoff_date)
    delete_old_files(PROFILE_IMAGES_DIR, cutoff_date)

    cleanup_old_data()

    os.kill(os.getpid(), signal.SIGTSTP)  # This sends SIGTSTP to pause the process

    print("Cleanup finished, exiting cleanly.")

if __name__ == "__main__":
    main_cleanup()