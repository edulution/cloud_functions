const { Storage } = require('@google-cloud/storage');
const bucketName = '';


exports.checkFile = (req, res) => {
    if (!(req.method === 'POST' && req.body)) {
        res.status(400).send('');
    }
    const event = req.body;
    if (event.type === 'MESSAGE') {
        /*reply = {
            text: `Hello ${event.user.displayName}`
        };*/
        // Get the file name from the request
        const fileName = req.body.message;

        /*Create a new Storage client*/
        const storage = new Storage();

        // Connect to the storage bucket
        const reportsBucket = storage.bucket(bucketName);

        // Check if the file exists in the bucket
        reportsBucket.file(fileName).exists()
            .then(data => {
                const fileExists = data[0];
                if (fileExists) {
                    // Get the file metadata
                    file.getMetadata()
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
};