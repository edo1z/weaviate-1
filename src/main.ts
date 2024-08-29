import weaviate, { WeaviateClient } from 'weaviate-ts-client';

interface Article {
  title: string;
  content: string;
}

const client: WeaviateClient = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});

const classObj = {
  class: 'Article',
  vectorizer: 'text2vec-transformers',
  vectorIndexType: 'hnsw',
  properties: [
    {
      name: 'title',
      dataType: ['text'],
    },
    {
      name: 'content',
      dataType: ['text'],
    },
  ],
};

async function createSchema() {
  try {
    await client.schema.classCreator().withClass(classObj).do();
    console.log('Schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
  }
}

async function addData() {
  try {
    await client.data
      .creator()
      .withClassName('Article')
      .withProperties({
        title: 'Weaviateの使い方',
        content: 'Weaviateは効率的なベクトルデータベースで、高速な類似性検索が可能です。',
      })
      .do();
    console.log('Data added successfully');
  } catch (error) {
    console.error('Error adding data:', error);
  }
}

async function getData() {
  try {
    const result = await client.graphql
      .get()
      .withClassName('Article')
      .withFields('title content')
      .do();

    const articles: Article[] = result.data.Get.Article;
    const tbody = document.querySelector('#dataTable tbody');
    if (tbody) {
      tbody.innerHTML = articles.map((article: Article) => `
        <tr>
          <td>${article.title}</td>
          <td>${article.content}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error getting data:', error);
  }
}

async function main() {
  await createSchema();
  await addData();
  await getData();
}

main();