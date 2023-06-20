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
        /* Log the message the user sent */
        console.log(`user: ${event.user.displayName} sent message ${messageText}`);

        /* Respond to 'hi', 'hello', and messages less than 3 characters */
        if (messageText === 'Hello' || messageText === 'Hi' || messageText.length < 3) {
            res.send({ text: `Hello ${event.user.displayName}.\nPlease message me the 3-letter acronym of a centre and I'll let you know if we've received reports from there` });
        } else {
            // Get the file name from the message text
            const fileName = messageText;
            console.log(`filename ${fileName}`);

            /* Create a new Storage client */
            const storage = new Storage();

            // Connect to the storage bucket
            const reportsBucket = storage.bucket(bucketName);
            console.log(`bucketname: ${bucketName}`);

            /* Convert the filenames to a string separated by newline characters */
            fileNames = [];
            reportsBucket.getFiles()
              .then(([files]) => {
                fileNames.push(...files.map(file => file.name));

                const activityFile = getMostRecentFile(fileNames, 'activity', fileName);
                const baselineFile = getMostRecentFile(fileNames, 'baseline', fileName);

                console.log(`most recent activity file: ${activityFile}`);
                console.log(`most recent baseline file: ${baselineFile}`);

                if (activityFile && baselineFile) {
                    const activityFileObj = reportsBucket.file(activityFile);
                    const baselineFileObj = reportsBucket.file(baselineFile);

                    Promise.all([
                        activityFileObj.getMetadata(),
                        baselineFileObj.getMetadata()
                    ]).then(([activityMetadata, baselineMetadata]) => {
                        const activitySize = convertBytesToKB(activityMetadata[0].size) + "KB";
                        const activityCreatedTime = new Date(activityMetadata[0].timeCreated).toLocaleDateString('en-US', dateFormatOptions);

                        const baselineSize = convertBytesToKB(baselineMetadata[0].size) + "KB";
                        const baselineCreatedTime = new Date (baselineMetadata[0].timeCreated).toLocaleDateString('en-US', dateFormatOptions);

                        res.send({
                            text: `Report for centre *${fileName}* found.\nActivity File:\n
                            size=${activitySize}\ncreated on ${activityCreatedTime}\n\nBaseline File:\nsize=${baselineSize}\ncreated on ${baselineCreatedTime}`
                        });
                    }).catch(err => {
                        console.error(err);
                        res.send({ text: 'An error occurred while retrieving file metadata.' });
                    });
                } else if (activityFile) {
                reportsBucket.file(activityFile).getMetadata()
                    .then(metadata => {
                        const createdTime = new Date(metadata[0].timeCreated).toLocaleDateString('en-US', dateFormatOptions);
	
                        res.send({
                            text: `Report for centre ${fileName} exists.\nActivity File: size=${metadata[0].size}, created at ${createdTime}, modified at ${modifiedTime}.\nNo baseline file found.`
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        res.send({ text: 'An error occurred while retrieving file metadata.' });
                    });
            } else if (baselineFile) {
                reportsBucket.file(baselineFile).getMetadata()
                    .then(metadata => {
                        const createdTime = new Date(metadata[0].timeCreated).toLocaleDateString('en-US', dateFormatOptions);

                        res.send({
                            text: `Report for centre *${fileName}* exists.\nNo activity file found.\n\nBaseline File:\nsize=${metadata[0].size}\ncreated at ${createdTime}`
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        res.send({ text: 'An error occurred while retrieving file metadata.' });
                    });
            } else {
                /* Log the event type */
                console.log(`user: ${event.user.displayName} sent event of type ${event.type}`);
                /* If the event is not a message, ask the user to send the expected kind of message */
                res.send({ text: `Hello ${event.user.displayName}.\nPlease message me the 3-letter acronym of a centre and I'll let you know if we've received reports from there` });
            }
                

              })
              .catch(err => {
                console.error(err);
                res.send({ text: 'An error occurred. Please try again later' });
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


function convertBytesToKB(fileSizeInBytes) {
  const fileSizeInKB = fileSizeInBytes / 1024; // Convert bytes to kilobytes
  const roundedSizeInKB = fileSizeInKB.toFixed(2); // Round off to 2 decimal places
  return roundedSizeInKB;
}
