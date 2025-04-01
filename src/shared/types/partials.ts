export abstract class PartialInstantiable<T> {
    constructor(props?: Partial<T>) {
        Object.assign(this, props ?? {});
    }
}

export class PartialEntity<T> {
    constructor(props?: Partial<T>){
        Object.assign(this, props ?? {});
    } 
}