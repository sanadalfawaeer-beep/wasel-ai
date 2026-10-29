import os

# Tests must never spend money or depend on a network.
os.environ["PLANNER_MODE"] = "mock"
os.environ["USE_LLM"] = "false"
os.environ["DEEPSEEK_API_KEY"] = ""
os.environ["GOOGLE_MAPS_API_KEY"] = ""
