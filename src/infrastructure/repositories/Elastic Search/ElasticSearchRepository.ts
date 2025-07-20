 import { elasticSearchRepository } from '@interfaces/ElasticSearchRepository'
// import { esClient } from '@config/elasticSearch.config'
import { ElasticEnum } from '@domain/enums/propertyEnum'
export class ElasticSearchRepository implements elasticSearchRepository {
  async indexPropertyToES(
    index: ElasticEnum,
    object: Record<string, any>,
  ): Promise<any> {
    // const store = await esClient.index({
    //   index,
    //   document: {
    //     ...object,
    //     listed_at: new Date().toISOString(),
    //   },
    // })
    try {
      // console.log(`Properties ${store._id} is added to elastic search`)
      // return store
    } catch (error) {
      console.log(`Not successfully added : ${error}`)
    }
  }

  async searchProperties(index: ElasticEnum, query: string): Promise<any> {
    // const property = await esClient.search({
    //   index,
    //   query: {
    //     multi_match: {
    //       query,
    //       fields: [
    //         'property_name^3',
    //         'property_description',
    //         'street_address',
    //         'city',
    //         'state',
    //       ],
    //       type: 'best_fields',
    //     },
    //   },
    // })
    // return property.hits.hits.map((hit) => hit._source)
  }
}
