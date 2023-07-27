const { Storage } = require('@google-cloud/storage');
const bucketName = process.env.REPORTS_BUCKET_NAME;

const dateFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
};


exports.checkFile = (req, res) => {
    /* Check the request method. If it is not a POST or req.body is empty, return 400 status and an empty message */
    if (!(req.method === 'POST' && req.body)) {
        res.status(400).send('');
        return;
    }

    /* Store the request body in the event variable */
    const event = req.body;

    /* Handle message events */
    if (event.type === 'MESSAGE') {
        /* Store the message text in a variable */
        const messageText = event.message.text;

        /*Store the displayName of the sender in a variable*/
        const senderName = event.user.displayName;

        /*Create a personalized greeting and simple instructions on how to use the bot*/
        const greetingAndInstructions = `Hello ${senderName}.\nPlease message me the 3-letter acronym of a centre and I'll let you know if we've received reports from there`;

        /*Polite error message*/
        /*const politeErrorMessage = "Sorry, I don't understand what you mean. Please message me the 3-letter acronym of a centre and I'll let you know if we've received reports from there";*/

        /* Log the message the user sent */
        console.log(`user: ${senderName} sent message ${messageText}`);

        const commonGreetings = ["hi", "hello", "hey", "whatsup", "ola", "bonjour", "sawubona"];

        /* Respond to 'hi', 'hello', and messages less than 3 characters */
        if (commonGreetings.includes(messageText.toLowerCase().trim()) || messageText.length < 3) {
            res.send({ text: greetingAndInstructions });
        } else {
            // Get the centre name from the message text. Convert to uppercase in case lowercase is submitted
            const centreName = messageText.toUpperCase().trim();
            console.log(`centre name: ${centreName}`);

            /* Create a new Storage client */
            const storage = new Storage();

            // Connect to the storage bucket
            const reportsBucket = storage.bucket(bucketName);
            console.log(`bucketname: ${bucketName}`);

            const userTimezone = req.headers['x-timezone'];
            const userLocale = req.headers['accept-language'];

            /*Initialize an array variable to store the names of the files in the bucket*/
            fileNames = [];
            /*Get all the files in the bucket then append them to the fileNames array*/
            reportsBucket.getFiles()
                .then(([files]) => {
                    fileNames.push(...files.map(file => file.name));

                    /*Get the most recent activity file using the getMostRecentFile function*/
                    const activityFile = getMostRecentFile(fileNames, 'activity', centreName);
                    /*Get the most recent baseline file using the getMostRecentFile function*/
                    const baselineFile = getMostRecentFile(fileNames, 'baseline', centreName);

                    console.log(`most recent activity file: ${activityFile}`);
                    console.log(`most recent baseline file: ${baselineFile}`);

                    /*If both an activity file and baseline file are found*/
                    if (activityFile && baselineFile) {
                        /*Store a reference to the activityFile object*/
                        const activityFileObj = reportsBucket.file(activityFile);
                        /*Store a reference to the baselineFile object*/
                        const baselineFileObj = reportsBucket.file(baselineFile);

                        /*Get the metadata for both the activity file and baseline file objects*/
                        Promise.all([
                            activityFileObj.getMetadata(),
                            baselineFileObj.getMetadata()
                        ]).then(([activityMetadata, baselineMetadata]) => {
                            /*Get the size and created time. */
                            /*Convert the size from bytes to KB*/
                            /*Convert the created time to a more readable format*/
                            const activitySize = convertBytesToKB(activityMetadata[0].size) + "KB";
                            const activityCreatedTime = new Date(activityMetadata[0].timeCreated).toLocaleDateString(userLocale, { ...dateFormatOptions, timeZone: userTimezone });

                            const baselineSize = convertBytesToKB(baselineMetadata[0].size) + "KB";
                            const baselineCreatedTime = new Date(baselineMetadata[0].timeCreated).toLocaleDateString(userLocale, { ...dateFormatOptions, timeZone: userTimezone });

                            const activtyMonth = getReportMonth(activityFile);
                            const baselineMonth = getReportMonth(baselineFile);

                            /*Send a response containing the size and created time for both activity and baseline files*/
                            res.send({
                                text: `Report for centre *${centreName}* found.\n*Activity Data*:\nfor month: ${activtyMonth}\nsize: ${activitySize}\nreceived on: ${activityCreatedTime}\n\n*Assessments Data*:\nfor month: ${baselineMonth}\nsize: ${baselineSize}\nreceived on: ${baselineCreatedTime}`
                            });
                        }).catch(err => {
                            /*Catch any errors and print them to the console*/
                            console.error(err);
                            /*Send a message back to the user that an error has occured*/
                            res.send({ text: greetingAndInstructions });
                        });
                    } else if (activityFile) {
                        /*If only an activity file has been found*/
                        /*Get the metadata of the file then get the size and created time*/
                        reportsBucket.file(activityFile).getMetadata()
                            .then(metadata => {
                                const createdTime = new Date(metadata[0].timeCreated).toLocaleDateString('en-US', dateFormatOptions);
                                const activtyMonth = getReportMonth(activityFile);

                                /*Send a message back to the user with the details of the activity file*/
                                /*Include in the message that no baseline file was found*/
                                res.send({
                                    text: `Report for centre ${centreName} exists.\n*Activity Data*: \nfor month: ${activtyMonth}\nsize: ${metadata[0].size}\nreceived on: ${createdTime}\nmodified at ${modifiedTime}.\n\nNo assessments data found.`
                                });
                            })
                            .catch(err => {
                                /*Catch any errors and print them to the console*/
                                console.error(err);
                                /*Send a message back to the user that an error has occured*/
                                res.send({ text: greetingAndInstructions });
                            });
                    } else if (baselineFile) {
                        /*If only a baseline file has been found*/
                        /*Get the metadata of the file then get the size and created time*/
                        reportsBucket.file(baselineFile).getMetadata()
                            .then(metadata => {
                                const createdTime = new Date(metadata[0].timeCreated).toLocaleDateString('en-US', dateFormatOptions);
                                const baselineMonth = getReportMonth(baselineFile);
                                /*Send a message back to the user with the details of the baseline file*/
                                /*Include in the message that no activity file was found*/
                                res.send({
                                    text: `Report for centre *${centreName}* exists.\nNo activity data found.\n\nAssessments Data:\nsize: ${metadata[0].size}\nreceived on: ${createdTime}`
                                });
                            })
                            .catch(err => {
                                /*Catch any errors and print them to the console*/
                                console.error(err);
                                /*Send a message back to the user that an error has occured*/
                                res.send({ text: greetingAndInstructions });
                            });
                    } else {
                        /*If none of the conditions above are satified*/
                        /* Log the event type */
                        console.log(`user: ${senderName} sent event of type ${event.type}`);
                        /* If the event is not a message, ask the user to send the expected kind of message */
                        res.send({ text: greetingAndInstructions });
                    }


                })
                .catch(err => {
                    /*Catch any errors and print them to the console*/
                    console.error(err);
                    /*Send a message back to the user that an error has occured*/
                    res.send({ text: greetingAndInstructions });
                });




        }
    }
};

/* Function to get the most recent file from a list of filenames */
function getMostRecentFile(filenames, reportType, centreId) {
    let mostRecentFilename = null;
    let mostRecentDateTime = null;

    const regex = new RegExp(`.*${reportType}_${centreId}_[0-9]{2}-[0-9]{2}_(\\d{14})\\..*$`);

    for (let i = 0; i < filenames.length; i++) {
        const match = filenames[i].match(regex);
        if (match) {
            const dateTime = match[1];
            if (mostRecentDateTime === null || dateTime > mostRecentDateTime) {
                mostRecentFilename = filenames[i];
                mostRecentDateTime = dateTime;
            }
        }
    }

    return mostRecentFilename || 'No file found';
}

/*Function which gets the month and year a report was extracted for, using the fileName*/
function getReportMonth(filename) {
    /*regex to capture the month and year from the filename*/
    const regex = /\w{3}_([0-9]{2}-[0-9]{2})/;
    /*match the regex in the filename*/
    const match = filename.match(regex);

    /*If the regex does not match any part of the filename, return an error*/
    if (!match) {
        return "Invalid filename format.";
    }

    /*Store the captured part of the regex in a variable*/
    const monthYear = match[1];

    /*Split the monthYear variable on the hyphen into month and year*/
    const [month, year] = monthYear.split('-');

    /*Array of all complete month names*/
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    /*If the month digit is less than 1 or more than 12, throw an error*/
    if (month < 1 || month > 12) {
        return "Invalid month in filename.";
    }

    /*Get the full month name from the array of month names by indexing*/
    const readableMonth = months[month - 1];

    /*Get the full year py prefixing with 20 (assume all years are in the 21st century)*/
    const fullYear = `20${year}`;

    /*Return the readable month and full year*/
    return `${readableMonth} ${fullYear}`;
}


/*Function to convert Bytes to KB*/
function convertBytesToKB(fileSizeInBytes) {
    const fileSizeInKB = fileSizeInBytes / 1024; // Convert bytes to kilobytes
    const roundedSizeInKB = fileSizeInKB.toFixed(2); // Round off to 2 decimal places
    return roundedSizeInKB;
}