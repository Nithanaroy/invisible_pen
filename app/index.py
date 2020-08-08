"""
References:
1. https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https
2. https://blog.miguelgrinberg.com/post/easy-websockets-with-flask-and-gevent
3. To authenticate local HTTPS certs https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/
"""
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import pyautogui
from pynput import keyboard
import ssl
from pathlib import Path
from contextlib import contextmanager
import logging


app = Flask(__name__, template_folder="client/out/", static_folder="client/out/_next/")
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

logging.getLogger('werkzeug').disabled = True

ORIGIN = {"x": 0, "y": 0}
tracking_hotkey = keyboard.Key.f5
tracking_on = False

@app.route('/')
def index():
    return "Hello World!"

@socketio.on('test-connection', namespace='/test')
def testConnection():
    emit('connect', {'data': 'Connected'})

@socketio.on('move-mouse', namespace='/test')
def move_mouse(coords):
    # emit('my response', {'data': message['data']})
    # print(coords)
    # pyautogui.dragTo(message[0] + ORIGIN["x"], message[1] + ORIGIN["y"], button='left')
    # pyautogui.moveTo(coords[0] + ORIGIN["x"], coords[1] + ORIGIN["y"], button='left')
    if tracking_on:
        pyautogui.mouseDown(coords[0] + ORIGIN["x"], coords[1] + ORIGIN["y"], button='left')


@socketio.on('release-mouse', namespace='/test')
def release_mouse():
    # print("Got a request to release the mouse")
    if tracking_on:
        print("Mouse released")
        pyautogui.mouseUp()


@socketio.on('set-origin-manual', namespace='/test')
def read_message(message):
    set_origin(message[0], message[1])


@socketio.on('set-origin-auto', namespace='/test')
def read_message():
    current_mouse_pos = pyautogui.position()
    set_origin(current_mouse_pos.x, current_mouse_pos.y)


def set_origin(x, y):
    global ORIGIN
    ORIGIN["x"], ORIGIN["y"] = x, y
    print(f"Updated origin to ({x}, {y})")


@socketio.on('my broadcast event', namespace='/test')
def read_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)


@socketio.on('connect', namespace='/test')
def ack_connect():
    # emit('my response', {'data': 'Connected'})
    print("Client connected")


@socketio.on('disconnect', namespace='/test')
def ack_disconnect():
    print('Client disconnected')

def on_key_press(key):
    global tracking_on
    if key == tracking_hotkey:
        tracking_on = True
        # print('special key {0} pressed'.format(key))

def on_key_release(key):
    global tracking_on
    if key == tracking_hotkey:
        print("Hotkey released, requesting to release the mouse from server side")
        release_mouse()
        tracking_on = False
        # print('special key {0} pressed'.format(key))

@contextmanager
def keyboard_listerner():
    listener = keyboard.Listener(on_press=on_key_press, on_release=on_key_release)
    try:
        listener.start()
        print("Keyboard listener started")
        yield listener
    finally:
        listener.stop()
        print("Keyboard listener released")

if __name__ == '__main__':
    cwd = Path(__file__).resolve().parent.as_posix()
    # context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
    # context.verify_mode = ssl.CERT_REQUIRED
    # context.load_verify_locations('/Users/nipasuma/Projects/invisble_pen/vendor/local-cert-generator/rootCA.pem')
    # context.load_cert_chain(f'{cwd}/certs/trusted-openssl/server.crt', f'{cwd}/certs/trusted-openssl/server.key')
    with keyboard_listerner() as l:
        socketio.run(app, host="0.0.0.0", ssl_context=(f'{cwd}/certs/trusted-openssl/server.crt', f'{cwd}/certs/trusted-openssl/server.key'))
        # socketio.run(app, host="0.0.0.0")
    print("Done!!!")
    # socketio.run(app, host="0.0.0.0", ssl_context=context)
