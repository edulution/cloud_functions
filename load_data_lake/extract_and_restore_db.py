import os
import subprocess
import tempfile
import zipfile

from google.cloud import storage
import psycopg2

# Google Cloud Storage bucket names
SOURCE_BUCKET_NAME = "source-bucket-name"
DESTINATION_BUCKET_NAME = "destination-bucket-name"

# Cloud SQL instance information
SOURCE_INSTANCE_NAME = "source-instance-name"
DESTINATION_INSTANCE_NAME = "destination-instance-name"
DB_NAME = "your-database-name"
DB_USER = "your-database-user"
DB_PASSWORD = "your-database-password"


def restore_database(data, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
        data (dict): The Cloud Functions event payload.
        context (google.cloud.functions.Context): Metadata of triggering event.
    """
    file_data = data["name"]
    if not file_data.endswith(".zip"):
        print("Not a zip file. Ignoring.")
        return

    print(f"Processing file: {file_data}.")

    # Download the zip file
    storage_client = storage.Client()
    bucket = storage_client.bucket(SOURCE_BUCKET_NAME)
    blob = bucket.blob(file_data)
    _, temp_local_filename = tempfile.mkstemp()
    blob.download_to_filename(temp_local_filename)

    # Extract the zip file
    with zipfile.ZipFile(temp_local_filename, "r") as zip_ref:
        zip_ref.extractall()

    # Connect to the source Cloud SQL instance
    source_conn = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=f"/cloudsql/{SOURCE_INSTANCE_NAME}",
    )

    # Create a new database
    cur = source_conn.cursor()
    cur.execute(f"CREATE DATABASE {DB_NAME};")
    source_conn.commit()
    cur.close()

    # Use pg_dump to create a SQL dump of the restored database with --inserts and --on-conflict-do-nothing options
    dump_file_name = f"{DB_NAME}.sql"
    dump_file_path = f"/tmp/{dump_file_name}"
    pg_dump_cmd = f"pg_dump -U {DB_USER} -h /cloudsql/{SOURCE_INSTANCE_NAME} {DB_NAME} --inserts --on-conflict-do-nothing > {dump_file_path}"
    subprocess.run(pg_dump_cmd, shell=True)

    # Upload the SQL dump to a destination Google Cloud Storage bucket
    destination_bucket = storage_client.bucket(DESTINATION_BUCKET_NAME)
    destination_blob = destination_bucket.blob(dump_file_name)
    destination_blob.upload_from_filename(dump_file_path)

    # Connect to the destination Cloud SQL instance
    destination_conn = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=f"/cloudsql/{DESTINATION_INSTANCE_NAME}",
    )

    # Create a new database in the destination Cloud SQL instance
    cur = destination_conn.cursor()
    cur.execute(f"CREATE DATABASE {DB_NAME};")
    destination_conn.commit()
    cur.close()

    # Restore the database from the SQL dump
    pg_restore_cmd = f"pg_restore -U {DB_USER} -h /cloudsql/{DESTINATION_INSTANCE_NAME} -d {DB_NAME} {dump_file_path}"
    subprocess.run(pg_restore_cmd, shell=True)

    # Clean up temporary files
    os.remove(temp_local_filename)
    os.remove(dump_file_path)

    print(f"File {file_data} has been processed.")
