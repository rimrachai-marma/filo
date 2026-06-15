declare namespace Intl {
  class DurationFormat {
    constructor(locale?: string, options?: object);
    format(duration: object): string;
  }
}
