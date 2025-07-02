export default class UnimplementedException extends Error {
  constructor(message, fatal = false) {
    super(message);
    this.name = "UnimplementedException";
    this.fatal = fatal;
  }
}
