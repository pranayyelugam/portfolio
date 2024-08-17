import React, { Component } from 'react';
import '../css/Projects.scss'
import {
    Link
} from "react-router-dom";
import Card from 'card-vibes'

const projects = [
    {
        'title': 'Reasoning with Generative Language Models and Knowledge Graphs for Common Sense Question Answering',
        'link': 'https://github.com/pranayyelugam/685_Projects',
        'description': "Recent works  showed that utilizing these both sources of knowledge yield impressive results for multi-choice question answering. Although active research is going on in combining LMs and KGs for commonsense reasoning(LM+KG), there is shortage of solutions that delves into \
         probing combination of Generative Language Models (GLMs) and knowledge graphs GLM+KG for commonsense question answering. In this paper, we try to tackle this problem by trying to combine implicit knowledge from \
        a generative model such as GPT-2 and explicit knowledge from KGs specifically ConceptNet."
    },
    {
        'title': 'Commonsense Frame Completion (CFC)',
        'link': 'https://github.com/Lorraine333/Frame-Completion',
        'description': "Commonsense knowledge is critical to achieving artificial general intelligence. Most tasks around commonsense posed multi-choice\
         question answering tasks  allowing models to exploit systematic biases. \
         Existing tasks do not capture the probabilistic nature of common sense. To this end we present commonsense frame completion(CFC), a new generative task which evaluates common sense via multiple open- ended generations.We also propose a method of probabilistic evaluation which strongly correlates with human judgements."

    },
    {
        'title': 'DISAPERE',
        'link': 'https://github.com/nnkennard/DISAPERE',
        'description': "At the foundation of scientific evaluation is the labor-intensive process of peer review. The  \
        reviews and the rebuttals in the evaluation process holds a lot of useful information. To analyze \
        that relationship, we present DISAPERE, a labeled dataset of 20k sentences contained in 506 review-rebuttal pairs in English, annotated by experts.\
        We show that discourse cues from rebuttals can shed light on the quality and interpretation of reviews."
    },
    {
        'title': 'Online Book Store Using RPC',
        'link': 'https://github.com/pranayyelugam/Online-book-store',
        'description': "                            A distributed online book store built using multi-tier web design and microservices. \
                           Implemented a loadbalancer to sent requests to different microservice replicas using round robin and least used protocols \
                            Each service has multiple replicas and consistency is maintained between the replicas using primary- backup consistency protocol. \
                            The microservices are fault - tolerant and can continue to function even if a replica is down. \
                           The microservices are dockerized and deployed to AWS."
    },
    {
        'title': 'How many Indian cities can you name?',
        'link': '/portfolio/projects/how_many_indian_cities_can_you_name',
        'is_internal': true,
        'description': "A fun web app to test your knowledge about the cities of India. Built using react- simple - maps in ReactJs. The backend is built using Flask and is hosted on Heroku."
    }

]


export default class ProjectsComponent extends Component {
    render() {
        const { isMobile } = this.props
        return (
            <div class="projects">
                <div class="projects-container">
                        {projects.map((project, index) => {
                            return (
                                <div class="project-block">
                                    <div style={{
                                            // width: isMobile ? '280px' : '400px',
                                        padding: isMobile ? '5px' : '5px',
                                        margin: isMobile ? '5px' : '5px',
                                        backgroundColor: '#2c3237'
                                            
                                        }}
                                        key={index}
                                    >
                                        {project?.is_internal ?
                                            <Link to={project.link} style={{
                                                textDecoration: "none"
                                                }}
                                            >
                                                {project.title}
                                            </Link> : <div><a href={project.link}> {project.title}</a></div>
                                            }
                                        
                                        <p>{project.description}</p>

                                        </div>
                                    </div>
                            )
                        })}
                  

                    
                        
                </div>
            </div>
                           
            
        )
    }
}