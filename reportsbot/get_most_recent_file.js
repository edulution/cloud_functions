function get_most_recent_file(filenames, inputString) {
    // Initialize variables to store the most recent filename and date
    let mostRecentFilename = null;
    let mostRecentDate = null;

    // Iterate through each filename in the filenames array
    for (let i = 0; i < filenames.length; i++) {
        // Split the filename using underscores
        const splitFilename = filenames[i].split("_");
        // Get the file prefix
        const filePrefix = splitFilename[1];
        // Get the file date
        const fileDate = new Date(`${splitFilename[3]}-01`);

        // Compare filePrefix to the input string
        if (filePrefix === inputString) {
            // If filePrefix matches the input string, check if the file date is more recent than the current most recent date
            if (mostRecentDate === null || fileDate > mostRecentDate) {
                mostRecentFilename = filenames[i];
                mostRecentDate = fileDate;
            }
        }
    }
    // Return the most recent filename or "Not found" if no matching file prefix was found
    return mostRecentFilename ? mostRecentFilename : "Not found";
}
