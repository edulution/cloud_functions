const { Storage } = require('@google-cloud/storage');
const bucketName = '';

exports.checkFile = (req, res) => {
    if (!(req.method === 'POST' && req.body)) {
          res.status(400).send('')
      }
    const event = req.body;
      let reply = {};
      if (event.type === 'MESSAGE') {
        reply = {
            text: `Hello ${event.user.displayName}`
        };
      }
    const storage = new Storage();

    // Get the file name from the request
    const fileName = req.body.file_name;

    // Connect to the storage bucket
    const reportsBucket = storage.bucket(bucketName);

    // Check if the file exists in the bucket
    reportsBucket.file(fileName).exists()
        .then(data => {
            const fileExists = data[0];
            if (fileExists) {
                // Notify the user that the file exists
                res.status(200).send({ message: 'File exists.' });
            } else {
                // Notify the user that the file does not exist
                res.status(404).send({ message: 'File does not exist.' });
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send({ message: 'An error occurred.' });
        });
};
