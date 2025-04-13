import { SeekPaginationOption, SeekPaginationResult } from "@shared/types/paginate"
import { Knex } from "knex"


type Paginate = SeekPaginationOption &  Record<any,any>;

export default async function <T>(query: Knex.QueryBuilder<any, any[]>, paginate: Paginate) : Promise<SeekPaginationResult<T>>  {
    const page = paginate?.page_number ?? 1
    const perPage = paginate?.result_per_page ?? 10
    const offset = (page - 1) * perPage

    const totalRecordsQuery = query.clone().count('* as count').first()
    const [{ count: total }] = await Promise.all([totalRecordsQuery])

    let dataQuery = query
    .clone()
    .limit(perPage)
    .offset(offset)

    const result = await dataQuery;
    const totalPages = Math.ceil(Number(total) / perPage)

    return new SeekPaginationResult<T>({
        result,
        result_per_page: perPage,
        page,
        total_records: Number(total),
        total_pages: totalPages,
        next_page: page < totalPages ? page + 1 : null,
        prev_page: page > 1 ? page - 1 : null,
    })
}