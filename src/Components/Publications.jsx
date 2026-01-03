import React, { useState } from 'react';
import '../css/Publications.scss'

const PublicationsComponent = () => {
    const [selectedTag, setSelectedTag] = useState(null);

    const publications = [
        {
            'title': 'Every Answer Matters: Evaluating Commonsense with Probabilistic Measures',
            'link': 'https://aclanthology.org/2024.acl-long.29/',
            'authors': "Qi Cheng, Michael Boratko, Pranay Kumar Yelugam, Tim O’Gorman, Nalini Singh, Andrew McCallum, and Xiang Li",
            'conference': 'ACL 2024',
            'tags': ['NLP', 'Commonsense QA', 'Probabilistic Methods']
        },
        {
            'title': 'DISAPERE: A Dataset for Discourse Structure in Peer Review Discussions',
            'link': 'https://arxiv.org/abs/2110.08520',
            'authors': "Neha Nayak Kennard, Tim O'Gorman, Rajarshi Das, Akshay Sharma, Chhandak Bagchi, Matthew Clinton, Pranay Kumar Yelugam, Hamed Zamani, Andrew McCallum",
            'conference': 'NAACL 2022',
            'tags': ['Discourse Structure', 'Peer Review', 'Dataset']
        },
        {
            'title': 'Real Time Mining of Ego Networks for Exploring Social Associations',
            'link': 'https://ieeexplore.ieee.org/document/8340594',
            'authors': 'A Bharadwaju, Yelugam Pranay Kumar, K Anudeep, AV Krishna, BR Prasad, S Agarwal',
            'conference': 'CICT 2017',
            'tags': ['Social Networks', 'Data Mining', 'Ego Networks']
        }
    ];

    const toggleTag = (tag) => {
        if (selectedTag === tag) {
            setSelectedTag(null);
        } else {
            setSelectedTag(tag);
        }
    };

    const visiblePublications = selectedTag
        ? publications.filter(pub => pub.tags && pub.tags.includes(selectedTag))
        : publications;

    return (
        <div className="publications">
            <ul className="pub-list">
                {visiblePublications.map((publication, index) => {
                    return (
                        <li key={index} className="pub-item">
                            <a href={publication.link} className="pub-title" target="_blank" rel="noopener noreferrer">
                                {publication.title}
                            </a>
                            <p className="pub-info">
                                {publication.authors}. <span className="pub-conf">{publication.conference}</span>
                            </p>
                            {publication.tags && (
                                <div className="tag-container" style={{ marginTop: '0.5rem' }}>
                                    {publication.tags.map((tag, i) => (
                                        <span 
                                            key={i} 
                                            className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
            {visiblePublications.length === 0 && (
                 <p>No publications found with tag "{selectedTag}"</p>
            )}
        </div>
    )
}

export default PublicationsComponent;