
class Logging {

  constructor() {}

  CreateMessage(message, stack) {

    return {
      message: message,
      stack: stack || console.trace
    };

  }

  log(message) {

    process.stdout(this.CreateMessage(message));

  }

  warning(message) {

    process.stdout(this.CreateMessage(message));

  }

  error(error) {

    process.stderr(this.CreateMessage(error.message, error.stack));

  }

}

module.exports = Logging;