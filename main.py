"""Serve the card-store pages and image files from a local web server."""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
from urllib.parse import urlsplit
import webbrowser


class StorefrontHandler(BaseHTTPRequestHandler):
	"""Map browser requests to the local pages and assets."""

	def do_GET(self):
		request_path = urlsplit(self.path).path
		# Fixed page and script routes; image files are handled separately below.
		assets = {
			"/": ("index.html", "text/html; charset=utf-8"),
			"/index.html": ("index.html", "text/html; charset=utf-8"),
			"/collection.html": ("collection.html", "text/html; charset=utf-8"),
			"/styles.css": ("styles.css", "text/css; charset=utf-8"),
			"/cards.js": ("cards.js", "text/javascript; charset=utf-8"),
			"/theme.js": ("theme.js", "text/javascript; charset=utf-8"),
		}
		if request_path in assets:
			filename, content_type = assets[request_path]
			file_path = Path(__file__).parent / filename
		elif request_path.startswith("/images/"):
			# Serve image files by name without requiring a separate route for each card.
			image_name = request_path[len("/images/"):]
			image_directory = (Path(__file__).parent / "images").resolve()
			file_path = (image_directory / image_name).resolve()
			if (Path(image_name).name != image_name or file_path.parent != image_directory
					or not file_path.is_file()):
				self.send_error(404)
				return
			content_type = mimetypes.guess_type(file_path.name)[0]
			if not content_type or not content_type.startswith("image/"):
				self.send_error(404)
				return
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
