import { getAllArticles } from '../lib/Articles';
import NewsClientView from './NewsClientView';

export default function NewsPage() {
  const articles = getAllArticles();

  return <NewsClientView articles={articles} />;
}