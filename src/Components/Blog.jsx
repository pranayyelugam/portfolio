import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import matter from 'gray-matter';
import '../css/Blogs.scss';

const Blog = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const loadPosts = async () => {
            const modules = import.meta.glob('/src/posts/*.md', { query: '?raw', import: 'default' });
            
            const postPromises = Object.keys(modules).map(async (path) => {
                const slug = path.split('/').pop().replace('.md', '');
                const rawText = await modules[path]();
                const { data } = matter(rawText);
                return {
                    slug,
                    ...data
                };
            });

            const loadedPosts = await Promise.all(postPromises);
            // Sort by date desc
            loadedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
            setPosts(loadedPosts);
        };

        loadPosts();
    }, []);

    return (
        <section className="content">
            <div className="blog-page">
                <h1 className="stylish-name" style={{ marginBottom: '2rem' }}>Insights</h1>
                <div className="posts-grid">
                    {posts.map(post => (
                        <Link to={`/blog/${post.slug}`} key={post.slug} className="post-card">
                            <article>
                                <h2 className="stylish-name" style={{ fontSize: '1.2rem' }}>{post.title}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {post.date}
                                </div>
                                <p style={{ color: 'var(--text-primary)' }}>{post.description}</p>
                            </article>
                        </Link>
                    ))}
                    {posts.length === 0 && <p>No posts found.</p>}
                </div>
            </div>
        </section>
    );
};

export default Blog;