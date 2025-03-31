export abstract class PartialInstantiable<T> {
    constructor(props?: Partial<T>) {
        Object.assign(this, props ?? {});
    }
}

export abstract class PartialEntity<T> {
    constructor(props?: Partial<T>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...props,
        });
    }
}