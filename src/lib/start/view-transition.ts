export function runWithViewTransition(doc: Document, callback: () => void): void {
  const startViewTransition = (doc as Partial<Document>).startViewTransition;

  if (typeof startViewTransition === "function") {
    startViewTransition.call(doc, callback);
    return;
  }

  callback();
}
