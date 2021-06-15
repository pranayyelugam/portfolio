import React, { Component } from 'react';
import '../css/Projects.scss'
import {
    Link
} from "react-router-dom";
import { ALIGN_LEFT } from 'react-svg-pan-zoom';
export default class ProjectsComponent extends Component {
    render() {
        return (
            <div class="projects">
                <div class="projects-container">


                    <div class="project-left">

                        <div class="project-block">
                            <a href="https://github.com/pranayyelugam/Online-book-store" style={{
                                textDecoration: "None"
                            }}>
                                <h3>  Online Book Store </h3>
                        </a>
                            <p>A distributed online book store built using multi-tier web design and microservices. </p>
                            <p>Implemented a loadbalancer to sent requests to different microservice replicas using round robin and least used protocols.</p>
                            <p>Each service has multiple replicas and consistency is maintained between the replicas using primary-backup consistency protocol.  </p>
                            <p>The microservices are fault-tolerant and can continue to function even if a replica is down.</p>
                            <p>The microservices are dockerized and deployed to AWS.</p>
                        </div>
                        <div class="project-block">
                            <Link to="/portfolio/projects/how_many_indian_cities_can_you_name" style={{
                                textDecoration: "none"
                            }}>  <h3> How many Indian cities can you name?</h3></Link>
                            <p>A fun web app to test your knowledge about the cities of India.</p>
                            <p>Built using react-simple-maps in ReactJs.</p>
                            <p>The backend is built using Flask and is hosted on Heroku.</p>
                        </div>

                    </div>
                    
                        
                </div>
            </div>
                           
            
        )
    }
}