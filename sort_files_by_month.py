import os
from datetime import datetime

from google.cloud import storage


def sort_files_by_month(data, context):
    # Extract bucket and file name from the event data
    bucket_name = data["bucket"]
    file_name = data["name"]

    # Derive the month and year from the file name
    date_str = file_name.split("_")[2]
    date_obj = datetime.strptime(date_str, "%m-%d_%Y%m%d%H%M%S")
    month_year_str = date_obj.strftime("%b-%y").lower()

    # Connect to the Google Cloud Storage bucket
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)

    # Create the folder for the month if it doesn't exist
    folder_name = month_year_str + "/"
    folder = bucket.blob(folder_name)
    if not folder.exists():
        folder.upload_from_string("")

    # Move the file to the folder for the month
    file_blob = bucket.blob(file_name)
    destination_blob = bucket.blob(folder_name + file_name)
    file_blob.move(destination_blob)
