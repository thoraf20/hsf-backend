// elasticsearch.service.ts
import { ElasticEnum } from "@domain/enums/propertyEnum";
import { Client } from "@elastic/elasticsearch";
import { getEnv } from "@infrastructure/config/env/env.config";

export const esClient = new Client({
  node: getEnv('ELASTICSEARCH_NODE') as string,
  auth: {
    apiKey: getEnv('ELASTICSEARCH_API_KEY')
  }
});
 
export async function indexPropertyToES(index: ElasticEnum, object: Record<string, any>) {
  try {
    await esClient.index({
      index,
      document: {
        ...object,
        listed_at: new Date().toISOString()
      }
    });
    console.log("Property indexed in Elasticsearch");
  } catch (err) {
    console.error("Failed to index property to ES:", err);
  }
}
