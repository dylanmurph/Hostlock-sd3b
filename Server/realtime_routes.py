# Server/realtime_routes.py
from flask import Blueprint, Response, render_template, send_from_directory
from .hardware import message_queue, IMAGE_DIR

realtime_bp = Blueprint("realtime", __name__)

@realtime_bp.route("/")
def index():
    # same index as in app.py
    return render_template("index.html")

@realtime_bp.route("/stream")
def stream():
    def event_stream():
        while True:
            msg = message_queue.get()
            yield f"data: {msg}\n\n"

    return Response(event_stream(), mimetype="text/event-stream")

@realtime_bp.route("/image/<filename>")
def serve_image(filename):
    return send_from_directory(IMAGE_DIR, filename)
