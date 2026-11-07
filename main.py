"""Serve the card-store pages and scripts from a local web server."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import webbrowser


class StorefrontHandler(BaseHTTPRequestHandler):
	"""Map browser requests to the local pages and assets."""

	def do_GET(self):
		request_path = urlsplit(self.path).path
		# Fixed page and script routes.
		assets = {
			"/": ("index.html", "text/html; charset=utf-8"),
			"/index.html": ("index.html", "text/html; charset=utf-8"),
			"/collection.html": ("collection.html", "text/html; charset=utf-8"),
			"/community.html": ("community.html", "text/html; charset=utf-8"),
			"/profile.html": ("profile.html", "text/html; charset=utf-8"),
			"/admin.html": ("admin.html", "text/html; charset=utf-8"),
			"/styles.css": ("styles.css", "text/css; charset=utf-8"),
			"/store-data.js": ("store-data.js", "text/javascript; charset=utf-8"),
			"/store-admin-tools.js": ("store-admin-tools.js", "text/javascript; charset=utf-8"),
			"/supabase-config.js": ("supabase-config.js", "text/javascript; charset=utf-8"),
			"/admin.js": ("admin.js", "text/javascript; charset=utf-8"),
			"/admin-access.js": ("admin-access.js", "text/javascript; charset=utf-8"),
			"/community-access.js": ("community-access.js", "text/javascript; charset=utf-8"),
			"/community-directory.js": ("community-directory.js", "text/javascript; charset=utf-8"),
			"/community-profile.js": ("community-profile.js", "text/javascript; charset=utf-8"),
			"/community-navigation.js": ("community-navigation.js", "text/javascript; charset=utf-8"),
			"/supabase/config.toml": ("supabase/config.toml", "text/plain; charset=utf-8"),
			"/theme.js": ("theme.js", "text/javascript; charset=utf-8"),
		}
		if request_path in assets:
			filename, content_type = assets[request_path]
			file_path = Path(__file__).parent / filename
		else:
			self.send_error(404)
			return
		try:
			# Resolve files from this script's folder, independent of the terminal location.
			content = file_path.read_bytes()
		except OSError:
			self.send_error(404)
			return
		self.send_response(200)
		self.send_header("Content-Type", content_type)
		self.send_header("Content-Length", str(len(content)))
		self.send_header("Cache-Control", "no-store")
		self.end_headers()
		self.wfile.write(content)


if __name__ == "__main__":
	# Local address opened when the server starts.
	url = "http://localhost:8000"
	server = ThreadingHTTPServer(("127.0.0.1", 8000), StorefrontHandler)
	print(f"Storefront running at {url}")
	if not webbrowser.open(url):
		print(f"Open this URL in your browser: {url}")
	try:
		server.serve_forever()
	except KeyboardInterrupt:
		print("\nServer stopped.")
	finally:
		server.server_close()
