from datetime import datetime
import re

from google.cloud import storage


def sort_files_by_month(request):
    # Extract the bucket name from the request data
    request_json = request.get_json()
    if request_json is None or "bucket" not in request_json:
        return 'Error: The request payload must include the "bucket" field.'

    bucket_name = request_json["bucket"]

    # Connect to the Google Cloud Storage bucket
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)

    # Loop through all the files in the bucket
    for blob in bucket.list_blobs():
        if blob.name.endswith("/"):
            # Skip directories
            continue

        # Skip files that are already in a directory
        if "/" in blob.name:
            continue

        # Get the file name and derive the month and year
        file_name = blob.name
        date_str = re.search(r"\d{4}\d{2}\d{2}\d{2}\d{2}\d{2}", file_name)
        if date_str is None:
            print(f"Skipping file {file_name}: no date string found")
            continue

        date_str = date_str.group()
        date_obj = datetime.strptime(date_str, "%Y%m%d%H%M%S")
        month_year_str = date_obj.strftime("%b-%y").lower()

        # Create the folder for the month if it doesn't exist
        folder_name = month_year_str + "/"
        folder = bucket.blob(folder_name)
        if not folder.exists():
            folder.upload_from_string("")

        # Copy the file to the folder for the month
        file_blob = bucket.blob(file_name)
        destination_blob = bucket.blob(folder_name + file_name)
        if not destination_blob.exists():
            destination_blob.upload_from_string(file_blob.download_as_string())
            file_blob.delete()
            print(f"Copied file {file_name} to folder {folder_name}")
        else:
            print(f"Skipping file {file_name}: already exists in {folder_name}")

    return "Success"
