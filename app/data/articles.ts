import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Point to the content folder at your project root
const contentDirectory = path.join(process.cwd(), 'content/news');

export function getAllArticles() {
  // Check if directory exists to prevent crashes
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);

  const allArticles = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id (e.g., "pga-tour-preview")
    const id = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(contentDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the metadata section
    const { data, content } = matter(fileContents);

    return {
      id,
      content,
      title: data.title,
      excerpt: data.excerpt,
      date: data.date,
      category: data.category,
      readTime: data.readTime,
    };
  });

  return allArticles;
}