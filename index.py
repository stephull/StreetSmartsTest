# PYTHON TEST: StreetSmarts

# imports
import os
import random
import json
import requests
import sqlite3
from datetime import datetime

# constants
IMG_DIR = "./Images/"
API_KEY = "AIzaSyAFthdy8d5DsWSLyRfW6Jilu8Zl_rziWc4"
MAIN_URL = "https://maps.googleapis.com/maps/api/streetview?size=640x640"
LIMIT = 15
ZOOM = 75
RANDOM = random.randint(1, 72)

# dictionary
meta = {}

# connect to database, always keep track of all geolocations generated!
conn = sqlite3.connect('geolocations.db')

# latitude and longitude: input
latitude = str(input("Enter latitude: "))
longitude = str(input("Enter longitude: "))

# create new folder inside "Images"
directory = str((datetime.now())).replace(' ', '').replace(":", '')[0:-7]
new_path = os.path.join(IMG_DIR, directory)
os.mkdir(new_path)

# render all images for location
count = 0
for i in range(-45, 90, 45):
    for j in range(0, 360, 72):
        # declare heading (left and right) and pitch (tilt)
        heading = j + RANDOM
        pitch = i
        
        # combine parameters for new URL 
        location_param = f'&location={latitude},{longitude}&fov={ZOOM}'
        heading_param = f'&heading={heading}'
        pitch_param = f"&pitch={pitch}"
        key_param = f"&key={API_KEY}"
        FINISHED_URL = f"{MAIN_URL}{location_param}{heading_param}{pitch_param}{key_param}"

        # use responses 
        try:
            response = requests.get(url=FINISHED_URL, stream=True)
        except: 
            raise json.JSONDecodeError

        # if successful, finally print to folder
        if response.status_code == 200:
            count += 1
            with open(f"./Images/{directory}/{i}x{j}.jpg", "wb") as fd:
                fd.write(response.content)
                fd.close()
                print(f"Printing {count} out of {LIMIT}...")
                
# retrieve nearest physical address (if applicable)
nearest = None
                
meta.update({'file': directory})
meta.update({'coordinates': {"latitude": latitude, "longitude": longitude}})
meta_json_dump = json.dumps(meta)
meta_json_object = json.loads(meta_json_dump)
# ... send JSON object to javascript to get images and directory name ...

# finally, save geolocation coordinates to the SQLite database made
conn.execute("""
             CREATE TABLE Geolocations (
                 LAT decimal(7, 6) NOT NULL,
                 LNG decimal(7, 6) NOT NULL,
                 NEAR varchar(255),
                 COUNT int,
                 DELTA decimal(5, 2)
             );
             """)
conn.execute(f"""
             INSERT INTO TABLE Geolocations (LAT, LNG, NEAR, COUNT, DELTA)
             VALUES ({latitude}, {longitude}, '{str(nearest)}', 0, 0);
             """)
            # come back to update COUNT and DELTA
            # DELTA indicates the percentage (up to 100.00) calculation of how far
                # others have made it to the location
conn.commit()
print(f"Coordinates ({latitude}, {longitude}) appended to database...")

retrievedDelta = 0
conn.execute(f"""
             UPDATE Geolocations 
             SET COUNT = COUNT + 1, DELTA = {retrievedDelta}
             WHERE LAT={latitude}, LNG={longitude};
             """)

conn.close()
# end of program.