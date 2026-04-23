import os

from app import create_app

app = create_app()

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_ENV", "development") == "development"
    use_reloader = os.getenv("FLASK_USE_RELOADER", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5001, debug=debug_mode, use_reloader=use_reloader)
