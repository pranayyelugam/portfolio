import React, { Component } from 'react';
import '../css/Blogs.scss'
export default class BlogComponent extends Component {
    render() {
        return (
            <section className="content">
                <article className="content-right" style={{ maxWidth: '100%', textAlign: 'left' }}>
                    <h1 className="stylish-name" style={{ marginBottom: '1rem' }}>Coming soon</h1>
                    <p>Stay tuned for updates.</p>
                </article>
            </section>
        )
    }
}