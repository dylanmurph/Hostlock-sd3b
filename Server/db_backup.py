import os
import signal
import subprocess
from Server import create_app
from Server.models import db
from datetime import datetime

app = create_app()

def backup_database():
    with app.app_context():
        BACKUP_DIR = "/home/ubuntu/hostlock-sd3b/backups"

        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR)

        backup_file = os.path.join(BACKUP_DIR, f"db_backup_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.sql")

        DATABASE = os.getenv('DB_NAME')

        if not DATABASE:
            print("Database name (DB_NAME) is not set. Aborting backup.")

        command = f"mysqldump -u {os.getenv('DB_USER')} -p{os.getenv('DB_PASSWORD')} -h {os.getenv('DB_HOST')} {DATABASE} > {backup_file}"

        try:
            subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
            print("Backup completed successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Backup failed: {e}")

def main_backup():
    backup_database()

    os.kill(os.getpid(), signal.SIGTSTP)  # This sends SIGTSTP to pause the process

    print("Backup finished, exiting cleanly.")

if __name__ == "__main__":
    main_backup()