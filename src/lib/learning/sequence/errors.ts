export class AdaptiveSequenceRunError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdaptiveSequenceRunError";
  }
}
