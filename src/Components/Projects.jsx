import React from 'react';
import '../css/Projects.scss';
import { Link } from 'react-router-dom';

const projects = [
    {
        id: 1,
        title: 'Reasoning with Generative Language Models and Knowledge Graphs for Common Sense Question Answering',
        link: 'https://github.com/pranayyelugam/685_Projects',
        description: "Recent work has shown that utilizing both sources of knowledge yields impressive results for multi-choice question answering. Although active research is going on in combining LLMs and KGs for commonsense reasoning, there is a shortage of solutions that delve into combining Generative Language Models (GLMs) and Knowledge Graphs (GLM+KG) for commonsense QA. In this paper, we tackle this problem by combining implicit knowledge from a generative model (GPT-2) and explicit knowledge from KGs (ConceptNet)."
    },
    {
        id: 2,
        title: 'Commonsense Frame Completion (CFC)',
        link: 'https://github.com/Lorraine333/Frame-Completion',
        description: "Commonsense knowledge is critical to achieving artificial general intelligence. Most tasks around commonsense are posed as multiple-choice questions, allowing models to exploit systematic biases. Existing tasks do not capture the probabilistic nature of common sense. To this end, we present Commonsense Frame Completion (CFC), a new generative task which evaluates common sense via multiple open-ended generations. We also propose a method of probabilistic evaluation which strongly correlates with human judgements."
    },
    {
        id: 3,
        title: 'DISAPERE',
        link: 'https://github.com/nnkennard/DISAPERE',
        description: "At the foundation of scientific evaluation is the labor-intensive process of peer review. The reviews and the rebuttals in the evaluation process contain a wealth of useful information. To analyze that relationship, we present DISAPERE, a labeled dataset of 20k sentences contained in 506 review-rebuttal pairs in English, annotated by experts. We show that discourse cues from rebuttals can shed light on the quality and interpretation of reviews."
    },
    /*
    {
        id: 4,
        title: 'Online Book Store Using RPC',
        link: 'https://github.com/pranayyelugam/Online-book-store',
        description: "A distributed online book store built using multi-tier web design and microservices. Implemented a loadbalancer to send requests to different microservice replicas using round robin and least used protocols. Each service has multiple replicas and consistency is maintained between the replicas using primary-backup consistency protocol. The microservices are fault-tolerant and can continue to function even if a replica is down. The microservices are dockerized and deployed to AWS."
    },
    {
        id: 5,
        title: 'How many Indian cities can you name?',
        link: '/projects/how_many_indian_cities_can_you_name',
        is_internal: true,
        description: "A fun web app to test your knowledge about the cities of India. Built using react-simple-maps in ReactJs. The backend is built using Flask and is hosted on Heroku."
    }
    */
];

const ProjectCard = ({ project }) => {
    const isExternal = !project.is_internal;
    
    return (
        <div className="project-card">
            <h3 className="project-title">
                {project.is_internal ? (
                    <Link to={project.link}>{project.title}</Link>
                ) : (
                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                        {project.title}
                    </a>
                )}
            </h3>
            <p className="project-description">{project.description}</p>
            {isExternal ? (
                <a 
                    href={project.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="project-link"
                >
                    <span className="link-icon">↗</span>
                    View on GitHub
                </a>
            ) : (
                <Link to={project.link} className="project-link">
                    <span className="link-icon">→</span>
                    Try it out
                </Link>
            )}
        </div>
    );
};

const ProjectsComponent = () => {
    return (
        <div className="projects">
            <h1 className="page-title">Projects</h1>
            <div className="projects-grid">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    );
};

export default ProjectsComponent;