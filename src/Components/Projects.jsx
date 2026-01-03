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

];

const ProjectCard = ({ project }) => {
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
            <p className="project-description">{project.description}</p>
        </li>
    );
};

const ProjectsComponent = () => {
    return (
        <div className="projects">
            <ul className="projects-list">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </ul>
        </div>
    );
};

export default ProjectsComponent;