import React, { useState } from 'react';
import '../css/Projects.scss';
import { Link } from 'react-router-dom';

const projects = [
    {
        id: 1,
        title: 'Commonsense QA with Generative Models and Knowledge Graphs',
        link: 'https://github.com/pranayyelugam/685_Projects',
        description: "Combines what a generative model knows implicitly (GPT-2) with explicit facts from a knowledge graph (ConceptNet) to answer commonsense questions, a pairing that most LLM + KG work had skipped.",
        tags: ["NLP", "Knowledge Graphs"]
    },
    {
        id: 2,
        title: 'Commonsense Frame Completion (CFC)',
        venue: 'ACL 2024',
        link: 'https://github.com/Lorraine333/Frame-Completion',
        description: "A generative commonsense task scored against many valid answers instead of a single multiple-choice key, with a probabilistic metric that closely tracks human judgement.",
        tags: ["NLP", "Commonsense Reasoning"]
    },
    {
        id: 3,
        title: 'DISAPERE',
        venue: 'NAACL 2022',
        link: 'https://github.com/nnkennard/DISAPERE',
        description: "20k expert-annotated sentences from 506 peer-review and rebuttal pairs, showing how the discourse in rebuttals reveals the quality and meaning of reviews.",
        tags: ["NLP", "Discourse Analysis"]
    },
];

const ProjectCard = ({ project, onTagClick, selectedTag }) => {
    const isExternal = !project.is_internal;
    const arrow = isExternal ? "↗" : "→";
    
    return (
        <li className="project-item">
            <h3 className="project-title">
                {project.is_internal ? (
                    <Link to={project.link}>{project.title} <span className="arrow">{arrow}</span></Link>
                ) : (
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                        {project.title} <span className="arrow">{arrow}</span>
                    </a>
                )}
            </h3>
            {project.venue && <p className="project-venue">{project.venue}</p>}
            <p className="project-description">{project.description}</p>
            {project.tags && (
                <div className="tag-container">
                    {project.tags.map((tag, i) => (
                        <button
                            type="button"
                            key={i}
                            className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                            onClick={() => onTagClick(tag)}
                            aria-pressed={selectedTag === tag}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </li>
    );
};

const ProjectsComponent = () => {
    const [selectedTag, setSelectedTag] = useState(null);

    const toggleTag = (tag) => {
        if (selectedTag === tag) {
            setSelectedTag(null);
        } else {
            setSelectedTag(tag);
        }
    };

    const visibleProjects = selectedTag 
        ? projects.filter(project => project.tags && project.tags.includes(selectedTag))
        : projects;

    return (
        <div className="projects">
            <header className="page-head">
                <h1>Projects</h1>
                <p>Code and data from my research.</p>
            </header>
            <ul className="projects-list">
                {visibleProjects.map((project) => (
                    <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onTagClick={toggleTag}
                        selectedTag={selectedTag}
                    />
                ))}
            </ul>
            {visibleProjects.length === 0 && (
                <p>No projects found with tag "{selectedTag}"</p>
            )}
        </div>
    );
};

export default ProjectsComponent;