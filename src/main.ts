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

async function editData(id: string, article: Article) {
  try {
    await client.data
      .updater()
      .withClassName('Article')
      .withId(id)
      .withProperties({
        title: article.title,
        content: article.content
      })
      .do();
    console.log('Data updated successfully');
    await getData();
  } catch (error) {
    console.error('Error updating data:', error);
  }
}

function updateTable(articles: Article[]) {
  const tbody = document.querySelector('#dataTable tbody');
  if (tbody) {
    tbody.innerHTML = articles.map((article: Article) => `
      <tr>
        <td>${article.title}</td>
        <td>${article.content}</td>
        <td class="button-group">
          <button class="edit-btn" data-id="${article._additional?.id}">編集</button>
          <button class="delete-btn" data-id="${article._additional?.id}">削除</button>
        </td>
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

    tbody.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.target as HTMLButtonElement).dataset.id;
        const row = (e.target as HTMLButtonElement).closest('tr');
        if (id && row) {
          const title = row.cells[0].textContent || '';
          const content = row.cells[1].textContent || '';
          openEditModal(id, title, content);
        }
      });
    });
  }
}

function openEditModal(id: string, title: string, content: string) {
  const modal = document.getElementById('editModal') as HTMLDivElement;
  const editForm = document.getElementById('editForm') as HTMLFormElement;
  const editId = document.getElementById('editId') as HTMLInputElement;
  const editTitle = document.getElementById('editTitle') as HTMLInputElement;
  const editContent = document.getElementById('editContent') as HTMLTextAreaElement;
  const cancelEdit = document.getElementById('cancelEdit') as HTMLButtonElement;

  editId.value = id;
  editTitle.value = title;
  editContent.value = content;

  modal.style.display = 'block';

  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const updatedArticle: Article = {
      title: editTitle.value,
      content: editContent.value,
    };
    await editData(editId.value, updatedArticle);
    modal.style.display = 'none';
  };

  cancelEdit.onclick = () => {
    modal.style.display = 'none';
  };
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