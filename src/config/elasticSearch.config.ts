import { Client } from "@elastic/elasticsearch";
import { getEnv } from "@infrastructure/config/env/env.config";

const client = new Client({
  node: getEnv('ELASTICSEARCH_NODE') as string,
  auth: {
    apiKey: getEnv('ELASTICSEARCH_API_KEY')
  }
});

const index = getEnv('ELASTICSEARCH_INDEX');

const mapping = {
  properties: {
    text: {
      type: "text"
    }
  }
};

async function updateMapping() {
  const response = await client.indices.putMapping({
    index,
    properties: mapping.properties as any
  });
  console.log(`working perfectly`, response);
}

updateMapping();
