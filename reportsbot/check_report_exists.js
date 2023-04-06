const { Storage } = require('@google-cloud/storage');
const bucketName = '';


exports.checkFile = (req, res) => {
        /*Check the request method. If it is a post, return 400 status and an empty message*/
        if (!(req.method === 'POST' && req.body)) {
            res.status(400).send('');
        }
        /*Store the request body in the event variable*/
        const event = req.body;
        /*handle message events*/
        if (event.type === 'MESSAGE') {
            /*Store the message text in a variable*/
            const messageText = event.message.text;
            /*Log the message the user sent*/
            console.log(`user: ${event.user.displayName} sent message ${messageText}`);

            /*Respond to hi, hello, and messages less than 3 characters*/
            if (messageText == "Hello" || messageText == "Hi" || messageText.length < 3) {
                res.send({ text: `Hello ${event.user.displayName}. \n Please message me the 3-letter acronymn of a centre and I'll let you know if we've recieved reports from there` });
            } else {
                // Get the file name from the message text
                const fileName = messageText;
                console.log(`filename ${fileName}`);

                /*Create a new Storage client*/
                const storage = new Storage();

                // Connect to the storage bucket
                const reportsBucket = storage.bucket(bucketName);
                console.log(`bucketname: ${bucketName}`);

                /*Convert the filenames to a string separated by newline characters*/
                const fileNames = reportsBucket.getFiles().map(file => file.name);

                const activityFile = get_most_recent_file(fileNames, "activity", fileName);
                const baselineFile = get_most_recent_file(fileNames, "baseline", fileName);


                if (activityFile && baselineFile) {
                    const activityFileObj = reportsBucket.file(activityFile);
                    const baselineFileObj = reportsBucket.file(baselineFile);

                    Promise.all([
                        activityFileObj.getMetadata(),
                        baselineFileObj.getMetadata()
                    ]).then(([activityMetadata, baselineMetadata]) => {
                        const activitySize = activityMetadata[0].size;
                        const activityCreatedTime = activityMetadata[0].timeCreated;

                        const baselineSize = baselineMetadata[0].size;
                        const baselineCreatedTime = baselineMetadata[0].timeCreated;
                        res.send({
                            text: `Report for centre *${fileName}* exists. \n Activity File: \nsize=${activitySize}\ncreated at ${activityCreatedTime}\n\n Baseline File:\n size=${baselineSize}\ncreated at ${baselineCreatedTime}`
                        });
                    }).catch(err => {
                        console.error(err);
                        res.send({ text: 'An error occurred while retrieving file metadata.' });
                    });
                } else if (activityFile) {
                    reportsBucket.file(activityFile).getMetadata()
                        .then(metadata => {
                            const createdTime = metadata[0].timeCreated;
                            const modifiedTime = metadata[0].updated;

                            res.send({
                                text: `Report for centre ${fileName} exists. \n Activity File: size=${metadata[0].size}, created at ${createdTime}, modified at ${modifiedTime}. \n No baseline file found.`
                            });
                        })
                        .catch(err => {
                            console.error(err);
                            res.send({ text: 'An error occurred while retrieving file metadata.' });
                        });
                } else if (baselineFile) {
                    reportsBucket.file(baselineFile).getMetadata()
                        .then(metadata => {
                            const createdTime = metadata[0].timeCreated;
                            const modifiedTime = metadata[0].updated;
                            res.send({
                                text: `Report for centre *${fileName}* exists. No activity file found.\n\n *Baseline File*:\n size=${metadata[0].size}\n created at ${createdTime}`
                            });
                        })
                        .catch(err => {
                            console.error(err);
                            res.send({ text: 'An error occurred while retrieving file metadata.' });
                        });

                } else {
                    /*Log the event type*/
                    console.log(`user: ${event.user.displayName} sent event of type ${event.type}`);
                    /*If the event is not a message, ask the user to send the expected kind of message*/
                    res.send({ text: `Hello ${event.user.displayName}. \n Please message me the 3-letter acronymn of a centre and I'll let you know if we've recieved reports from there` });
                }
            };


/*Function to get most recent file from a list of filenames*/
function get_most_recent_file(filenames, report_type, centre_id) {
  let mostRecentFilename = null;
  let mostRecentDateTime = null;

  const regex = new RegExp(`^${report_type}_${centre_id}_[0-9]{2}-[0-9]{2}_(\\d{14})\\..*$`);

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

  return mostRecentFilename || "No file found";
}