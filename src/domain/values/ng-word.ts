export class NgWord {
  readonly word: string;

  constructor(word: string) {
    if (!word.trim()) {
      throw new Error("NG word must not be empty");
    }
    this.word = word;
  }

  isContainedIn(message: string): boolean {
    return message.toLowerCase().includes(this.word.toLowerCase());
  }
}
