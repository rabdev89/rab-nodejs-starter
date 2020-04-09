class LazyInstance<T> {

    private instance: T;

    constructor(private readonly initializer: () => T) { }

    public get(): T {
        return this.instance || (this.instance = this.initializer());
    }
}

/**
 * Creates a new instance of <T> getter that uses the specified initializer function.
 * The first call to get() executes the lambda passed to lazy() and remembers the result,
 * subsequent calls to get() simply return the remembered result.
 *
 * If the initialization of a value throws an exception, it will attempt to reinitialize the value at next access.
 *
 * @param {() => T} initializer
 * @returns {{get(): T}}  Returns property accessor to lazy instance.
 */
export function lazy<T>(initializer: () => T): { get(): T } {
    return new LazyInstance<T>(initializer);
}
