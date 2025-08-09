export default class UnimplementedException extends Error {
  fatal: boolean;

  constructor(message: string, fatal: boolean = false) {
    super(message);
    this.name = "UnimplementedException";
    this.fatal = fatal;
  }
}
