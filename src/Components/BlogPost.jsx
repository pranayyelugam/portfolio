import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';
import 'katex/dist/katex.min.css';
import '../css/Blogs.scss';

const BlogPost = () => {
    const { slug } = useParams();
    const [content, setContent] = useState('');
    const [metadata, setMetadata] = useState(null);

    useEffect(() => {
        const loadPost = async () => {
            try {
                // Dynamic import for the markdown file
                // Note: Vite glob keys are relative to the current file or absolute
                const modules = import.meta.glob('/src/posts/*.md', { query: '?raw', import: 'default' });
                const path = `/src/posts/${slug}.md`;
                
                if (modules[path]) {
                    const rawText = await modules[path]();
                    const { data, content } = matter(rawText);
                    setMetadata(data);
                    setContent(content);
                } else {
                    setContent('# 404 Not Found\nPost does not exist.');
                }
            } catch (error) {
                console.error("Error loading post:", error);
                setContent('# Error\nCould not load post.');
            }
        };

        loadPost();
    }, [slug]);

    if (!content) {
        return <div className="blog-page">Loading...</div>;
    }

    return (
        <article className="blog-page">
            {metadata && (
                <header>
                    <h1 className="stylish-name" style={{ fontSize: '2.5rem' }}>{metadata.title}</h1>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        <span>{metadata.date}</span> • <span>{metadata.author}</span>
                    </div>
                </header>
            )}
            <div className="markdown-content">
                <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        img: ({node, ...props}) => <img {...props} className="blog-image" loading="lazy" />
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </article>
    );
};

export default BlogPost;
