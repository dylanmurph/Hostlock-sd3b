from flask import Flask
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_cors import CORS
from dotenv import load_dotenv
import os
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

    # Log presence of AWS env vars at startup (do not log secrets)
    app.logger.info(f"AWS_BUCKET={'set' if os.getenv('AWS_BUCKET') else 'unset'}, AWS_REGION={'set' if os.getenv('AWS_REGION') else 'unset'}, AWS_ACCESS_KEY={'set' if os.getenv('AWS_ACCESS_KEY') else 'unset'}")

    # Get database and JWT secret
    database_url = os.getenv("DATABASE_URL")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")
    website_path = os.getenv("WEBSITE_PATH") # Used for CORS

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["JWT_SECRET_KEY"] = jwt_secret_key
    # Token expiry configuration (can be overridden with env vars)
    # ACCESS token default: 15 minutes
    access_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
    # REFRESH token default: 30 days
    refresh_days = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30"))
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=access_minutes)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=refresh_days)
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
        User, BnB, Booking, UserBooking, Fob, FobBooking, AccessLog, TamperAlert, RevokedToken,
    )

    # Register token-in-blocklist callback for JWT revocation
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload.get("jti")
        if not jti:
            return True
        return RevokedToken.query.filter_by(jti=jti).first() is not None

    with app.app_context():
        print("Creating database tables (if not already created)...")
        try:
            db.create_all()
            print("Tables created successfully!")
        except Exception as e:
            print(f"Error creating tables: {e}")

    # ------------------------------------------------------------
    # REGISTER BLUEPRINTS
    # ------------------------------------------------------------
    from .auth import auth_bp
    from .bnb_routes import bnb_bp
    from .booking_routes import booking_bp # <-- This one holds the upload logic
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
    # START PUBNUB 
    # ------------------------------------------------------------
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
        HardwareService.start(app)
    else:
        print("Skipping HardwareService start in main process (waiting for reloader)...")

    return app