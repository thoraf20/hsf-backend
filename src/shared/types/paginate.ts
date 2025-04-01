import { PartialInstantiable } from "./partials";

export type SeekPaginationOption = Partial<{
  result_per_page: number;
  page_number: number;
}>;

export class SeekPaginationResult<T> extends PartialInstantiable<
  SeekPaginationResult<T>
> {
  result_per_page: number;
  result: T[];
  page: number;

  constructor(data : Partial<SeekPaginationResult<T>>){
    super(data)
    Object.assign(this, data);
  }
}