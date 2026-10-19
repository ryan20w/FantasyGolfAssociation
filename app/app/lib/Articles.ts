import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Point directly to the root content folder
const contentDirectory = path.join(process.cwd(), 'content');

export function getAllArticles() {
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  // Read all files in the content folder, filtering for only .md files
  const fileNames = fs.readdirSync(contentDirectory).filter(file => file.endsWith('.md'));

  const allArticles = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(contentDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const { data, content } = matter(fileContents);

    return {
      id,
      content,
      title: data.title || "Untitled",
      excerpt: data.excerpt || "",
      date: data.date || "",
      category: data.category || "General",
    };
  });

  return allArticles;
}