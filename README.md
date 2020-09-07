# The Invisible Pen

The aim of the project is to try and convert any computer screen into a touch screen using computer vision algorithms. With remote communication becoming more popular such a technology helps remove barriers to express ideas freely on a virtual whiteboard without the need for a mouse. A regular pen or any pointer object can be used to draw on your laptop screen, without any ink! The algorithm tracks the position of your pointer and sends signals to the browser to mimic a mouse move.

## Demos

Below is a basic screencast showing how the custom detection model detects the whiteboard (compute screen) and a marker on a set of images completely in browser using tensorflow-js. It can be reproduced on your machine by hosting [this version](https://github.com/Nithanaroy/invisible_pen/blob/0853ec31644213fd57a40fa03ff28e35ea2199da/static-wb-detection.html) of the project using a simple HTTP server.

<a href="https://youtu.be/nt8XFkXnr5w" target="_blank"><img src="https://i.imgur.com/2zHNkgM.jpg"/></a>

For a **live demo** of the latest app & model visit https://invisible-pen.vercel.app/

## Setup

### On Phone
- Visit https://bit.ly/invisible-pen on your phone and give permission to access your webcam. The phone tracks your hand movements and sends them to your laptop wirelessly via websockets.

### On Laptop
- Install [conda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/) and create an environment, say `invipen`, using commands listed [here](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html#creating-an-environment-from-an-environment-yml-file)
- [Install uWSGI](https://uwsgi-docs.readthedocs.io/en/latest/Install.html) for speedy socket based wireless communication between the phone and laptop. `brew install uwsgi` works on Mac as described at http://macappstore.org/uwsgi/ 
- Open a new terminal session for the changes to kick in
- Install [gevent](https://uwsgi-docs.readthedocs.io/en/latest/Gevent.html) for high performance async computing with uWSGI. It depends on libraries like `libevent`, which can be installed via `brew install libevent` on Mac
- Open a new terminal session for the changes to kick in
- Generate certificates and place the .crt, .pem, .key files in a new folder called app/server/certs/trusted-openssl
- Start server

## Development Setup

### Client
- This website is eventually launched on a mobile device, which tracks the user's hand position
- `npm run dev` in `app/client` folder which starts a react server on http://0.0.0.0:3000

#### To test on phone
- Install ngrok and forward react server's port using `ngrok http 3000`
- Access the pasted HTTPS from the URL pasted by ngrok. You may have to turn off any VPN gateway to access the site. HTTPS URL is needed to access webcam on phone and ngrok helps with this tunneling, and is convinient while development as it also supports hot reload facility

### Server
- `conda activate invipen`
- Run `python app/index.py` to start the mouse controller server inside the activated virtual environment
- Note: remember to remove gevent or eventlet to start the server in development mode as shared at https://flask-socketio.readthedocs.io/en/latest/#embedded-server