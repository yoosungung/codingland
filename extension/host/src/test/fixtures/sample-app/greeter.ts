/** E2E fixture — predictable ingest target (dogfood scenarios). */
export function greet(name: string): string {
  return `Hello, ${name}`;
}

export class Greeter {
  constructor(private readonly prefix: string) {}

  call(name: string): string {
    return `${this.prefix}${name}`;
  }
}

