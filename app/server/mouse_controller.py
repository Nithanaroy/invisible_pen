class MouseController:
    def __init__(self):
        super().__init__()
        self._mouse_origin = (0, 0)
        self._finger_origin = (0, 0)
        self._tracking_on = False
        self.curr_finger_pos = (0, 0)

    def get_mouse_origin(self):
        return self._mouse_origin

    def set_mouse_origin(self, x, y):
        self._mouse_origin = x, y
        print(f"Updated origin of the mouse to {self._mouse_origin}")

    def get_finger_origin(self):
        return self._finger_origin

    def save_curr_finger_as_origin(self):
        self._finger_origin = self.curr_finger_pos
        print(f"Updated origin of the tracking finger to {self._finger_origin}")

    def is_tracking_on(self):
        return self._tracking_on

    def set_tracking_state(self, tracking_state):
        self._tracking_on = tracking_state