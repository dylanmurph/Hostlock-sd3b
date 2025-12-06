from flask import Flask
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Initialize extensions
db = SQLAlchemy()  # This is for the database
bcrypt = Bcrypt()  # For password hashing
jwt = JWTManager()  # For managing JSON Web Tokens (JWT)

def create_app():
    app = Flask(__name__, static_url_path="/uploads", static_folder="uploads")

    # Get database and JWT secret from the environment variables
    database_url = os.getenv("DATABASE_URL")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY")

    # Set up Flask app configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url  # Database connection string
    app.config["JWT_SECRET_KEY"] = jwt_secret_key  # Secret key for JWT
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = (
        False  # Disable modification tracking for memory efficiency
    )

    # Enable CORS for both production and local environments
    # Allow Authorization header so JWT tokens in the Authorization: Bearer <token>
    # header are accepted by the browser when calling protected endpoints.
    CORS(
        app,
        origins=["https://www.hostlocksd3b.online"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
    )

    # Initialize the extensions with the app
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Import models after initializing the database
    from .models import (
    User,
    BnB,
    Booking,
    UserBooking,
    Fob,
    FobBooking,
    AccessLog,
    TamperAlert,
)

    # Create all tables in the database if they don't already exist
    with app.app_context():
        print("Creating database tables (if not already created)...")
        try:
            db.create_all()  # This creates the tables for all the models in the database
            print("Tables created successfully!")

            # Test if the models are registered correctly by querying the User model
            first_user = (
                User.query.first()
            )  # Try to get the first user from the User table
            print(f"First User: {first_user}")

        except Exception as e:
            print(
                f"Error creating tables: {e}"
            )  # Print any error if table creation fails

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

    return app  # Return the app instance