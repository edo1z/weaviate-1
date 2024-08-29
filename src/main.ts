import weaviate, { WeaviateClient } from 'weaviate-ts-client';

interface Article {
  id?: string;
  title: string;
  content: string;
  _additional?: {
    id: string;
  };
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

async function addData(article: Article) {
  try {
    const result = await client.data
      .creator()
      .withClassName('Article')
      .withProperties({
        title: article.title,
        content: article.content
      })
      .do();
    console.log('Data added successfully');
    return result;
  } catch (error) {
    console.error('Error adding data:', error);
  }
}

async function getData() {
  try {
    const result = await client.graphql
      .get()
      .withClassName('Article')
      .withFields('title content _additional { id }')
      .do();

    const articles: Article[] = result.data.Get.Article;
    updateTable(articles);
  } catch (error) {
    console.error('Error getting data:', error);
  }
}

async function deleteData(id: string) {
  try {
    await client.data.deleter().withClassName('Article').withId(id).do();
    console.log('Data deleted successfully');
    await getData();
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

function updateTable(articles: Article[]) {
  const tbody = document.querySelector('#dataTable tbody');
  if (tbody) {
    tbody.innerHTML = articles.map((article: Article) => `
      <tr>
        <td>${article.title}</td>
        <td>${article.content}</td>
        <td><button class="delete-btn" data-id="${article._additional?.id}">削除</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLButtonElement).dataset.id;
        if (id) {
          await deleteData(id);
        }
      });
    });
  }
}

async function main() {
  await createSchema();
  await getData();

  const form = document.getElementById('articleForm') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('title') as HTMLInputElement;
    const contentInput = document.getElementById('content') as HTMLTextAreaElement;

    const newArticle: Article = {
      title: titleInput.value,
      content: contentInput.value,
    };

    await addData(newArticle);
    await getData();

    titleInput.value = '';
    contentInput.value = '';
  });
}

main();