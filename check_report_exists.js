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

            // Check if the file exists in the bucket
            reportsBucket.file(fileName).exists()
                .then(data => {
                    const fileExists = data[0];
                    if (fileExists) {
                        // Get the file metadata
                        reportsBucket.file(fileName).getMetadata()
                            .then(metadata => {
                                const createdTime = metadata[0].timeCreated;
                                const modifiedTime = metadata[0].updated;
                                res.send({ text: `File exists. \n Created at ${createdTime}. \n Last modified at ${modifiedTime}` });
                            })
                            .catch(err => {
                                console.error(err);
                                res.send({ text: 'An error occurred while retrieving file metadata.' });
                            });
                    } else {
                        // Notify the user that the file does not exist
                        res.send({ text: 'File does not exist.' });
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.send({ text: 'An error occurred while checking file existence.' });
                });
        }
    } else {
        /*If the event is not a message, ask the user to send the expected kind of message*/
        res.send({ text: `Hello ${event.user.displayName}. \n Please message me the 3-letter acronymn of a centre and I'll let you know if we've recieved reports from there` });
    }
};