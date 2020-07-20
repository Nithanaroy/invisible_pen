from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import pyautogui

app = Flask(__name__, template_folder="client/out/", static_folder="client/out/_next/")
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

ORIGIN = {"x": 0, "y": 0}


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('move-mouse', namespace='/test')
def move_mouse(coords):
    # emit('my response', {'data': message['data']})
    print(coords)
    # pyautogui.dragTo(message[0] + ORIGIN["x"], message[1] + ORIGIN["y"], button='left')
    # pyautogui.moveTo(coords[0] + ORIGIN["x"], coords[1] + ORIGIN["y"], button='left')
    # pyautogui.mouseDown(coords[0] + ORIGIN["x"], coords[1] + ORIGIN["y"], button='left')


@socketio.on('release-mouse', namespace='/test')
def release_mouse():
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


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0")
