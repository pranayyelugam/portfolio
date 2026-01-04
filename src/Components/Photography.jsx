import React, { useState, useEffect } from 'react';
import '../css/Photography.scss';
import Images from './images';

const Photography = () => {
    const [selectedTag, setSelectedTag] = useState(null);
    const [visibleImages, setVisibleImages] = useState([]);

    useEffect(() => {
        const filtered = selectedTag
            ? Images.filter(img => img.tags && img.tags.includes(selectedTag))
            : Images;
        setVisibleImages(filtered);
    }, [selectedTag]);

    const toggleTag = (tag, e) => {
        e.stopPropagation();
        setSelectedTag(selectedTag === tag ? null : tag);
    };

    return (
        <div className="photography-page">
            
            <div className="filter-status">
                {selectedTag && (
                    <span>
                        Filtering by: <strong>{selectedTag}</strong>
                        <button 
                            className="clear-filter"
                            onClick={() => setSelectedTag(null)}
                        >
                            Clear
                        </button>
                    </span>
                )}
            </div>

            <div className="gallery-grid">
                {visibleImages.map((item) => (
                    <div key={item.id} className="gallery-item">
                        <img 
                            src={item.src} 
                            alt={item.alt} 
                            className="gallery-img"
                            loading="lazy" 
                        />
                        <div className="gallery-overlay">
                            <h3 className="overlay-title">{item.title}</h3>
                            {item.tags && (
                                <div className="overlay-tags">
                                    {item.tags.slice(0, 2).map((tag, i) => (
                                        <span 
                                            key={i} 
                                            className={`tag-pill mini ${selectedTag === tag ? 'active' : ''}`}
                                            onClick={(e) => toggleTag(tag, e)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {visibleImages.length === 0 && (
                <p className="no-results">No photos found for this tag.</p>
            )}
        </div>
    );
};

export default Photography;