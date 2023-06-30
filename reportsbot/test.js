const { expect } = require('chai');
const sinon = require('sinon');
const { checkFile, convertBytesToKB } = require('./index.js');

describe('checkFile', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        type: 'MESSAGE',
        message: {
          text: 'Hello',
        },
        user: {
          displayName: 'John',
        },
      },
    };

    res = {
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send a welcome message if the request body is empty', () => {
    req.body = null;

    checkFile(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.send.calledWith('')).to.be.true;
  });

  it("should send a welcome message if the request method is not 'POST'", () => {
    req.method = 'GET';

    checkFile(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.send.calledWith('')).to.be.true;
  });

  it("should send a welcome message if the message text is 'Hello'", () => {
    req.body.message.text = 'Hello';

    checkFile(req, res);

    expect(res.send.calledOnce).to.be.true;
    expect(res.send.args[0][0].text).to.equal('Hello John.\nPlease message me the 3-letter acronym of a centre and I\'ll let you know if we\'ve received reports from there');
  });

  it('should send a welcome message if the message text has less than 3 characters', () => {
    req.body.message.text = 'Hi';

    checkFile(req, res);

    expect(res.send.calledOnce).to.be.true;
    expect(res.send.args[0][0].text).to.equal('Hello John.\nPlease message me the 3-letter acronym of a centre and I\'ll let you know if we\'ve received reports from there');
  });

  // Add more test cases for different scenarios

  // ...

});

describe('convertBytesToKB', () => {
  it('should convert bytes to kilobytes and round off to 2 decimal places', () => {
    const fileSizeInBytes = 2048;
    const result = convertBytesToKB(fileSizeInBytes);
    expect(result).to.equal('2.00');
  });

  // Add more test cases for different file sizes

  // ...
});
