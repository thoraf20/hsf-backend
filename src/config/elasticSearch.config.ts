// elasticsearch.service.ts
import { Client } from "@elastic/elasticsearch";
import { getEnv } from "@infrastructure/config/env/env.config";

export const esClient = new Client({
  node: getEnv('ELASTICSEARCH_NODE') as string,
  auth: {
    apiKey: getEnv('ELASTICSEARCH_API_KEY')
  }
});

export async function indexPropertyToES(property: any) {
  try {
    await esClient.index({
      index: getEnv('ELASTICSEARCH_INDEX'),
      document: {
        ...property,
        listed_at: new Date().toISOString()
      }
    });
    console.log("Property indexed in Elasticsearch");
  } catch (err) {
    console.error("Failed to index property to ES:", err);
  }
}
