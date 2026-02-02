# ------------------------------------------------------------
# SCREEN & UI CONFIG
# ------------------------------------------------------------
RIBBON_H=100
TOP_PANEL_H=50      # height of top toolbar panel
ICON_SIZE = 40         # tool icon size inside toolbar
TOOL_SPACING = 13      # space between icons
TOOLS_PER_PAGE = 6       # how many tools show per toolbar page

SPAWN_COOLDOWN = 0.7   # seconds between spawning tools


# ------------------------------------------------------------
# OBJECT CONFIG
# ------------------------------------------------------------

# ------------------------------------------------------------
# TOOL SCALE CONFIG
# ------------------------------------------------------------

#TOOL_SCALES = {
#    "flask": 0.85,
#   "beaker": 0.9,
#  "test_tube": 0.7,
##"dropper": 0.5,
#}

#DEFAULT_TOOL_SCALE = 0.8


BASE_SIZE = 100          # base render size for flask / tools
LERP_FACTOR = 0.18       # smooth movement factor


# ------------------------------------------------------------
# PLATFORM CONFIG
# ------------------------------------------------------------

SLOT_COUNT = 3      # number of platform slots

# make slots a bit smaller and nicer
SLOT_W = 180            # slot width (for hitbox & rendering)
SLOT_H = 100             # slot height

# place platform at ~80% of screen height instead of hard 500px
# (works on any resolution)
SLOT_Y = 0.80            # fraction of screen height (0.0–1.0)

SLOT_SPACING = 220       # space between slots


# ------------------------------------------------------------
# PHYSICS CONFIG
# ------------------------------------------------------------

GRAVITY = 900.0          # gravitational force
GROUND_DAMPING = 0.3     # bounce reduction


# ------------------------------------------------------------
# REACTION CONFIG
# ------------------------------------------------------------

REACTION_DURATION = 3.5  # seconds
SMOKE_PARTICLES = 35    # number of smoke particles to spawn


# ------------------------------------------------------------
# DROPLET CONFIG (for droppers)
# ------------------------------------------------------------

DROPLET_SIZE = 8         # pixel size of each droplet
DROPLET_GRAVITY = 750.0  # droplet fall acceleration
DROPLET_FADE_RATE = 0.9  # shrink per second
DROPLET_VOLUME = 5.0     # how much liquid each drop adds


# ------------------------------------------------------------
# FLAME / BURNER CONFIG
# ------------------------------------------------------------

FLAME_SPEED = 0.05       # time between flame frames (20 FPS)
FLAME_SCALE = 0.9        # flame size relative to burner PNG
FLAME_OFFSET_Y = -120    # how high above burner flame appears

HEAT_MULTIPLIER = 1.8    # accelerates reaction if burner is under flask
