import { ElasticEnum } from "@domain/enums/propertyEnum";
import { Properties } from "@entities/Property";

export interface elasticSearchRepository {
      indexPropertyToES( index: ElasticEnum, input: Properties): Promise<Properties | any>,
      searchProperties(index: ElasticEnum, query: string): Promise<any>
}