#!/usr/bin/env python3
"""
Simple HTTP server for app_treino project.
Run this script to serve the static files on localhost.
"""
import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse

# Configuration
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # If path is '/', redirect to index.html
        if self.path == '/':
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        # Add CORS headers to allow the frontend to make requests to Supabase
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

def run_server():
    # Change to the directory containing the web files
    os.chdir(DIRECTORY)
    
    handler = MyHttpRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        print(f"Open http://localhost:{PORT}/index.html in your browser")
        print("Press Ctrl+C to stop the server")
        
        # Open the browser automatically
        webbrowser.open(f'http://localhost:{PORT}/index.html')
        
        # Start the server
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
