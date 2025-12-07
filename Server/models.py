from . import db, bcrypt
from datetime import datetime, timezone

# ==========================================================
# USER ROLES
# ==========================================================

class UserRole:
    ADMIN = "admin"
    HOST = "host"
    GUEST = "guest"


# ==========================================================
# ROLE PERMISSIONS
# ==========================================================

ROLE_PERMISSIONS = {
    UserRole.ADMIN: {"manage_users", "manage_all_bnbs", "view_all_logs", "device_register", "view_self"},
    UserRole.HOST: {"manage_own_bnbs", "view_own_logs", "manage_credentials_own", "device_register", "view_self"},
    UserRole.GUEST: {"view_self"},
}

# ==========================================================
# USERS TABLE
# ==========================================================

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    contact_number = db.Column(db.String(32))
    photo_path = db.Column(db.String(500))
    last_login_at = db.Column(db.DateTime)

    role = db.Column(db.String(32), nullable=False, default=UserRole.GUEST, index=True)

    hosted_bnbs = db.relationship("BnB", back_populates="host", lazy="dynamic")
    bookings = db.relationship("UserBooking", back_populates="user", lazy="dynamic")
    access_logs = db.relationship("AccessLog", back_populates="recognized_user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.check_password_hash(self.password_hash, password)

    @property
    def permissions(self) -> set:
        return ROLE_PERMISSIONS.get(self.role, set())

    def has_permission(self, permission_name: str) -> bool:
        return permission_name in self.permissions

    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def is_host(self) -> bool:
        return self.role == UserRole.HOST

    def is_guest(self) -> bool:
        return self.role == UserRole.GUEST


# ==========================================================
# BNBS TABLE
# ==========================================================

class BnB(db.Model):
    __tablename__ = "bnbs"

    id = db.Column("bnb_id", db.Integer, primary_key=True)
    unique_code = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(255), unique=True, nullable=False)

    host_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    host = db.relationship("User", back_populates="hosted_bnbs")

    bookings = db.relationship("Booking", back_populates="bnb", lazy="dynamic")
    access_logs = db.relationship("AccessLog", back_populates="bnb", lazy="dynamic")
    tamper_alerts = db.relationship("TamperAlert", back_populates="bnb", lazy="dynamic")


# ==========================================================
# BOOKINGS TABLE
# ==========================================================

class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column("booking_id", db.Integer, primary_key=True)
    bnb_id = db.Column(db.Integer, db.ForeignKey("bnbs.bnb_id"), nullable=False)
    bnb = db.relationship("BnB", back_populates="bookings")

    booking_code = db.Column(db.String(64), unique=True, nullable=False)
    check_in_time = db.Column(db.DateTime, nullable=False)
    check_out_time = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True),nullable=False,default=lambda: datetime.now(timezone.utc)
)


    user_links = db.relationship("UserBooking", back_populates="booking", lazy="dynamic")
    fob_links = db.relationship("FobBooking", back_populates="booking", lazy="dynamic")
    access_logs = db.relationship("AccessLog", back_populates="booking", lazy="dynamic")


# ==========================================================
# USER <-> BOOKINGS TABLE
# ==========================================================

class UserBooking(db.Model):
    __tablename__ = "user_bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.booking_id"), nullable=False)
    is_primary_guest = db.Column(db.Boolean, nullable=False, default=False)

    user = db.relationship("User", back_populates="bookings")
    booking = db.relationship("Booking", back_populates="user_links")


# ==========================================================
# FOBS TABLE
# ==========================================================

class Fob(db.Model):
    __tablename__ = "fobs"

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(64), unique=True, nullable=False)
    label = db.Column(db.String(128))
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    bookings = db.relationship("FobBooking", back_populates="fob", lazy="dynamic")
    access_logs = db.relationship("AccessLog", back_populates="fob", lazy="dynamic")


# ==========================================================
# FOB <-> BOOKINGS TABLE
# ==========================================================

class FobBooking(db.Model):
    __tablename__ = "fob_bookings"

    id = db.Column(db.Integer, primary_key=True)
    fob_id = db.Column(db.Integer, db.ForeignKey("fobs.id"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.booking_id"), nullable=False)

    active_from = db.Column(db.DateTime, nullable=False)
    active_until = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    fob = db.relationship("Fob", back_populates="bookings")
    booking = db.relationship("Booking", back_populates="fob_links")


# ==========================================================
# ACCESS LOGS TABLE
# ==========================================================

class AccessLog(db.Model):
    __tablename__ = "access_logs"

    id = db.Column("log_id", db.Integer, primary_key=True)

    bnb_id = db.Column(db.Integer, db.ForeignKey("bnbs.bnb_id"), nullable=False)
    bnb = db.relationship("BnB", back_populates="access_logs")

    raw_uid = db.Column(db.String(64), nullable=False, index=True)

    fob_id = db.Column(db.Integer, db.ForeignKey("fobs.id"))
    fob = db.relationship("Fob", back_populates="access_logs")

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    recognized_user = db.relationship("User", back_populates="access_logs")

    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.booking_id"))
    booking = db.relationship("Booking", back_populates="access_logs")

    time_logged = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    match_result = db.Column(db.String(32), nullable=False)
    face_confidence = db.Column(db.Float)
    snapshot_path = db.Column(db.String(500))
    event_type = db.Column(db.String(32))


# ==========================================================
# TAMPER ALERTS TABLE
# ==========================================================

class TamperAlert(db.Model):
    __tablename__ = "tamper_alerts"

    id = db.Column(db.Integer, primary_key=True)
    bnb_id = db.Column(db.Integer, db.ForeignKey("bnbs.bnb_id"), nullable=False)
    bnb = db.relationship("BnB", back_populates="tamper_alerts")

    tamper_id = db.Column(db.String(64), nullable=False, default="Dundalk Apartments Tamper")

    status = db.Column(db.String(32), nullable=False, default="pending", index=True)

    triggered_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    snapshot_path = db.Column(db.String(500))
