from physics import apply_gravity

def update(state, dt, floor_y,ensure_burner_fields):
    for obj in state:
        if not obj.get("active", True):
            continue
        ensure_burner_fields(obj)
        grabbed = obj.get("grabbed",False )
        
        if not grabbed:
            apply_gravity(obj,dt,floor_y)
        else:
            obj["vel"]*=0.0
            obj["angular_vel"]*=0.90
            
            obj["angular_vel"]*=0.96
            obj["current_angle"]+= obj["angular_vel"]*dt *60.0
            
            size=obj.get("size",80)
            bottom=obj["pos"][1] +size // 2
            
            if obj["vel"][1]> 0:
                obj["vel"][1]=0
                obj["vel"][0]*=0.85
                
                bottom = obj["pos"][1]+obj["size"]//2
                
                if bottom > floor_y:
                    obj["pos"][1]=floor_y-obj["size"]//2
                    obj["vel"][1]=0 
        
