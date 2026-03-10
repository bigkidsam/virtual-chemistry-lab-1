from collections import deque


class Labstate:
    
    
    def __init__(self):
        
        
        # WORLD
        
        self.world_objects=[]
        self.particles =[]
        self.slot_states=[]
        
        
        #HAND TRACKING
        
        self.hands={}
        
        self.hands_buffers={
            "Left":deque(maxlen=5),
            "Right":deque(maxlen=5),
        }
        self.pinch_prev={
            "Left":False,
            "Right":False,
        }
        
        #TIMING 
        
        self.time=0.0
        self.running = True
        
        #UI
        
        self.toolbar = None 
        self.icon_positions =[]
        
        
        #Safe Helpers
        
        def add_object(self,obj):
            if isinstance(obj,dict):
                self.world_objects.append(obj)
                
                def remove_object(self,obj):
                    if obj in self.world_objects:
                        self.world_objects.remove(obj)
                        
                        def clear_particles(self):
                            self.particles.clear()
        