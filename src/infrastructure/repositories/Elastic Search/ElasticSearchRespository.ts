import { elasticSearchRespository } from "@interfaces/ElasticSearchRespository";
import { esClient } from "@config/elasticSearch.config";
import { ElasticEnum } from "@domain/enums/propertyEnum";
export class ElasticSearchRespository implements elasticSearchRespository {
     async  indexPropertyToES(index: ElasticEnum, object: Record<string, any>): Promise<any>{
     const store =  await esClient.index({
             index,
             document: {
               ...object,
               listed_at: new Date().toISOString()
             }
           });
     try {
         console.log(`Properties ${store._id} is added to elastic search`)
         return store 
     } catch (error) {
         console.log(`Not successfully added : ${error}`)
     }
          
}
}