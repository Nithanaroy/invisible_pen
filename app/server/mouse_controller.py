class MouseController:
    def __init__(self):
        super().__init__()
        self._mouse_origin = (0, 0)
        self._mouse_bounds = (0, 0) # max bottom right coords from mouse's perspective 
        self._finger_origin = (0, 0)
        self._finger_bounds = (0, 0)  # max bottom right coords from finger's perspective
        self._tracking_on = False
        self.curr_finger_pos = (0, 0)

    def get_mouse_origin(self):
        return self._mouse_origin

    def set_mouse_bounds(self, corner, x, y):
        if corner == "top-left":
            self._mouse_origin = x, y
        elif corner == "bottom-right":
            self._mouse_bounds = x, y
        else:
            print(f"Unknown corner, {corner} - ignored")
            return
        print(f"Updated {corner} corner of the mouse to {x, y}")

    def get_finger_origin(self):
        return self._finger_origin

    def use_curr_finger_as_corner(self, corner):
        x, y = self.curr_finger_pos
        if corner == "top-left":
            self._finger_origin = x, y
        elif corner == "bottom-right":
            self._finger_bounds = x, y
        else:
            print(f"Unknown corner, {corner} - ignored")
            return
        print(f"Updated {corner} corner of the tracking finger to {x, y}")


    def set_finger_bounds(self, corner, x, y):
        if corner == "top-left":
            self._finger_origin = x, y
        elif corner == "bottom-right":
            self._finger_bounds = x, y
        else:
            print(f"Unknown corner, {corner} - ignored")
            return
        print(f"Updated {corner} corner of the tracking finger to {x, y}")


    def is_tracking_on(self):
        return self._tracking_on

    def set_tracking_state(self, tracking_state):
        self._tracking_on = tracking_state
