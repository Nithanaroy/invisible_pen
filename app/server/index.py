"""
References:
1. https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https
2. https://blog.miguelgrinberg.com/post/easy-websockets-with-flask-and-gevent
3. To authenticate local HTTPS certs https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/
"""
import traceback, sys

from flask import Flask, request
from flask_socketio import SocketIO, emit
import pyautogui
from pynput import keyboard
import ssl
from pathlib import Path
from contextlib import contextmanager
import logging
from mouse_controller import MouseController

app = Flask(__name__, template_folder="client/out/", static_folder="client/out/_next/")
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*", cookie=None)

logging.getLogger('werkzeug').disabled = True

mc = MouseController()
tracking_hotkey = keyboard.Key.f5
connected_clients = set([])

@app.route('/')
def index():
    return "Hello World!"

@socketio.on('test-connection', namespace='/test')
def testConnection():
    emit('connect', {'data': 'Connected'})

# @socketio.on('move-mouse', namespace='/test')
# def move_mouse(coords):
#     # emit('my response', {'data': message['data']})
#     # print(coords)
#     # pyautogui.dragTo(message[0] + origin[0], message[1] + origin[1], button='left')
#     # pyautogui.moveTo(coords[0] + origin[0], coords[1] + origin[1], button='left')
#     mc.curr_finger_pos = coords
#     if mc.is_tracking_on():
#         mouse_origin = mc.get_mouse_origin()
#         finger_origin = mc.get_finger_origin()
#         # pyautogui.mouseDown(coords[0] + mouse_origin[0] - finger_origin[0],
#                             # coords[1] + mouse_origin[1] - finger_origin[1], button='left')
#         pyautogui.moveTo(coords[0] + mouse_origin[0] - finger_origin[0],
#                             coords[1] + mouse_origin[1] - finger_origin[1])


@socketio.on('move-mouse', namespace='/test')
def move_mouse(finger_coords):
    if mc.is_tracking_on():
        # TODO: check if finger_coords are within the finger's bounding box
        mouse_origin = mc.get_mouse_origin()
        finger_origin = mc.get_finger_origin()
        mouse_x_displacement = abs(finger_coords[0] - finger_origin[0]) * mc.x_scale
        mouse_y_displacement = abs(finger_coords[1] - finger_origin[1]) * mc.y_scale
        pyautogui.moveTo(mouse_origin[0]  + mouse_x_displacement, mouse_origin[1] + mouse_y_displacement)


@socketio.on('release-mouse', namespace='/test')
def release_mouse():
    # print("Got a request to release the mouse")
    if mc.is_tracking_on():
        print("Mouse released")
        pyautogui.mouseUp(button="left") # TODO: for some reason mouse button is still pressed, when moving with mouseDown in move_mouse()


@socketio.on('set-mouse-origin-manual', namespace='/test')
def read_message(message):
    mc.set_mouse_origin(message[0], message[1])


@socketio.on('set-mouse-top-left', namespace='/test')
def read_message():
    current_mouse_pos = pyautogui.position()
    mc.set_mouse_bounds("top-left", current_mouse_pos.x, current_mouse_pos.y)


@socketio.on('set-mouse-bottom-right', namespace='/test')
def read_message():
    current_mouse_pos = pyautogui.position()
    mc.set_mouse_bounds("bottom-right", current_mouse_pos.x, current_mouse_pos.y)

@socketio.on('set-finger-top-left', namespace='/test')
def read_message(coords):
    # mc.use_curr_finger_as_corner("top-left")
    mc.set_finger_bounds("top-left", coords[0], coords[1])

@socketio.on('set-finger-bottom-right', namespace='/test')
def read_message(coords):
    # mc.use_curr_finger_as_corner("bottom-right")
    mc.set_finger_bounds("bottom-right", coords[0], coords[1])

@socketio.on('my broadcast event', namespace='/test')
def read_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)


@socketio.on('connect', namespace='/test')
def ack_connect():
    # emit('my response', {'data': 'Connected'})
    print(f"Client connected, {request.sid}")
    connected_clients.add(request.sid)


@socketio.on('disconnect', namespace='/test')
def ack_disconnect():
    print(f'Client disconnected, {request.sid}')
    connected_clients.remove(request.sid)

def broadcast_to_all_clients(data):
    # create a copy of clients to avoid race conditions of set being modified during iteration
    for client_id in set(connected_clients):
        try:
            # socketio.emit('message', data, room=client_id, namespace="/test")
            socketio.emit('message', data, namespace="/test")
        except RuntimeError:
            print(f"Failed to post the message, {data} to {client_id}")
            traceback.print_exc(file=sys.stdout)

def on_key_press(key):
    if key == tracking_hotkey:
        if not mc.is_tracking_on():
            print("Hotkey pressed, started tracking")
            broadcast_to_all_clients({'data': 'tracking-on'})
        mc.set_tracking_state(True)
        pyautogui.mouseDown()

def on_key_release(key):
    if key == tracking_hotkey:
        print("Hotkey released, requesting to release the mouse from server side")
        broadcast_to_all_clients({'data': 'tracking-off'})
        # release_mouse()
        pyautogui.mouseUp()
        mc.set_tracking_state(False)
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
    # context.load_verify_locations(f'{cwd}/certs/trusted-openssl/rootCA.pem')
    # context.load_cert_chain(f'{cwd}/certs/trusted-openssl/server.crt', f'{cwd}/certs/trusted-openssl/server.key')
    with keyboard_listerner() as l:
        socketio.run(app, host="0.0.0.0", ssl_context=(f'{cwd}/certs/trusted-openssl/server.crt', f'{cwd}/certs/trusted-openssl/server.key'))
        # socketio.run(app, host="0.0.0.0")
        # socketio.run(app, host="192.168.0.5", ssl_context=context)
    print("Done!!!")
