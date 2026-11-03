from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


class StorefrontHandler(BaseHTTPRequestHandler):
	def do_GET(self):
		assets = {
			"/": ("index.html", "text/html; charset=utf-8"),
			"/index.html": ("index.html", "text/html; charset=utf-8"),
			"/collection.html": ("collection.html", "text/html; charset=utf-8"),
			"/styles.css": ("styles.css", "text/css; charset=utf-8"),
			"/images/marlon-slab.jpg": ("images/marlon-slab.jpg", "image/jpeg"),
			"/images/marlon-slab-back.jpg": ("images/marlon-slab-back.jpg", "image/jpeg")
		}
		if self.path not in assets:
			self.send_error(404)
			return
		filename, content_type = assets[self.path]
		try:
			content = (Path(__file__).parent / filename).read_bytes()
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
