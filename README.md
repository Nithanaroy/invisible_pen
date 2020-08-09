# The Invisible Pen

The aim of the project is to try and convert any computer screen into a touch screen using computer vision algorithms. With remote communication becoming more popular such a technology helps remove barriers to express ideas freely on a virtual whiteboard without the need for a mouse. A regular pen or any pointer object can be used to draw on your laptop screen, without any ink! The algorithm tracks the position of your pointer and sends signals to the browser to mimic a mouse move.

## Demos

Below is a basic screencast showing how the custom detection model detects the whiteboard (compute screen) and a marker on a set of images completely in browser using tensorflow-js. It can be reproduced on your machine by hosting [this version](https://github.com/Nithanaroy/invisible_pen/blob/0853ec31644213fd57a40fa03ff28e35ea2199da/static-wb-detection.html) of the project using a simple HTTP server.

<a href="https://youtu.be/nt8XFkXnr5w" target="_blank"><img src="https://i.imgur.com/2zHNkgM.jpg"/></a>

For a **live demo** of the latest app & model visit https://invisible-pen.vercel.app/

## Development Setup

### Client
1. `npm run dev` in `app/client` folder which starts a react server on http://0.0.0.0:3000
2. Install ngrok and forward react server's port using `ngrok http 3000`
3. Access the pasted HTTPS from the URL pasted by ngrok, without a VPN
4. Steps 2 and 3 wont be necessary in production as we use vercel hosting service for deployment. HTTPS URL is needed to access webcam on phone and ngrok helps with this tunneling, and is convinient while development as it also supports hot reload facility

### Server
1. `conda activate invipen`
1. Run `python app/index.py` to start the mouse controller server inside the activated virtual environment