export class StandardError<T> {
  type: T;

  constructor(type: T) {
    this.type = type;
  }
}
