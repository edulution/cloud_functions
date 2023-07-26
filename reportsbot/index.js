const { Storage } = require('@google-cloud/storage');
const bucketName = '';

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

        /* Log the message the user sent */
        console.log(`user: ${senderName} sent message ${messageText}`);

        /* Respond to 'hi', 'hello', and messages less than 3 characters */
        if (messageText === 'Hello' || messageText === 'Hi' || messageText.length < 3) {
            res.send({ text: greetingAndInstructions });
        } else {
            // Get the centre name from the message text
            const fileName = messageText;
            console.log(`filename ${fileName}`);

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
                    const activityFile = getMostRecentFile(fileNames, 'activity', fileName);
                    /*Get the most recent baseline file using the getMostRecentFile function*/
                    const baselineFile = getMostRecentFile(fileNames, 'baseline', fileName);

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

                            /*Send a response containing the size and created time for both activity and baseline files*/
                            res.send({
                                text: `Report for centre *${fileName}* found.\n*Activity File*:\nsize:${activitySize}\nreceived on ${activityCreatedTime}\n\n*Baseline File (tests)*:\nsize:${baselineSize}\nreceived on ${baselineCreatedTime}`
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
                                /*Send a message back to the user with the details of the activity file*/
                                /*Include in the message that no baseline file was found*/
                                res.send({
                                    text: `Report for centre ${fileName} exists.\n*Activity File*: size:${metadata[0].size}, received on: ${createdTime}, modified at ${modifiedTime}.\nNo baseline file found.`
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
                                /*Send a message back to the user with the details of the baseline file*/
                                /*Include in the message that no activity file was found*/
                                res.send({
                                    text: `Report for centre *${fileName}* exists.\nNo activity file found.\n\nBaseline File:\nsize=${metadata[0].size}\nreceived on: ${createdTime}`
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

/*Function to convert Bytes to KB*/
function convertBytesToKB(fileSizeInBytes) {
    const fileSizeInKB = fileSizeInBytes / 1024; // Convert bytes to kilobytes
    const roundedSizeInKB = fileSizeInKB.toFixed(2); // Round off to 2 decimal places
    return roundedSizeInKB;
}