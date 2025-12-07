from flask import Flask
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import the new service
from .hardware_service import HardwareService
from .realtime_routes import realtime_bp

# Load environment variables from the .env file
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__, static_url_path="/uploads", static_folder="uploads")

    # Get database and JWT secret
    database_url = os.getenv("DATABASE_URL")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")
    website_path = os.getenv("WEBSITE_PATH")

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["JWT_SECRET_KEY"] = jwt_secret_key
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    CORS(
        app,
        origins=[website_path],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
    )

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Import models
    from .models import (
        User, BnB, Booking, UserBooking, Fob, FobBooking, AccessLog, TamperAlert,
    )

    with app.app_context():
        print("Creating database tables (if not already created)...")
        try:
            db.create_all()
            print("Tables created successfully!")
            # Optional: Check first user
            # first_user = User.query.first()
            # print(f"First User: {first_user}")
        except Exception as e:
            print(f"Error creating tables: {e}")

    # ------------------------------------------------------------
    # REGISTER BLUEPRINTS
    # ------------------------------------------------------------
    from .auth import auth_bp
    from .bnb_routes import bnb_bp
    from .booking_routes import booking_bp
    from .fob_routes import fob_bp
    from .access_routes import access_bp
    from .tamper_routes import tamper_bp
    from .hardware_routes import hardware_bp
    from .dbroute import db_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(bnb_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(fob_bp)
    app.register_blueprint(access_bp)
    app.register_blueprint(tamper_bp)
    app.register_blueprint(hardware_bp)
    app.register_blueprint(db_bp)

    # ------------------------------------------------------------
    # START PUBNUB (Fix for Debug/Reloader Duplication)
    # ------------------------------------------------------------
    # This ensures PubNub only starts in the reloader process (the one that stays alive)
    # OR if debug is off.
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        HardwareService.start()
    else:
        print("Skipping HardwareService start in main process (waiting for reloader)...")

    return app