# Script to get durations of all Kolibri videos in csv file
# Assumes that all of the videos are in 1 directory and have format .mp4

# filename  joins to local_file_id in content_file table
import csv
import os
from moviepy.editor import *

# Columnn headers
col_headers = ["file", "duration"]

# Initialize empty dict for the file durations
file_durations = []

# Loop through files in the current directory
for file in os.listdir():
    # If the file ends with .mp4, get the duration in seconds
    if file.endswith(".mp4"):
        filename = os.path.splitext(file)[0]
        duration = VideoFileClip(file).duration

        # Get the filename and duration as a dict
        # Append to the file_durations list
        file_durations.append({"file": filename, "duration": duration})
    else:
        continue

# Write the file_durations list to csv
with open("video_durations.csv", "w") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=col_headers)
    writer.writeheader()
    writer.writerows(file_durations)
