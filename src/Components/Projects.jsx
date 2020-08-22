import React, { Component } from 'react';
import '../css/books.scss'
import {
    Link
} from "react-router-dom";
export default class ProjectsComponent extends Component {
    render() {
        return (
            <div class="books-container">
                <h1 className="stylish-name">Projects </h1>
                <ui>
                    <li style={{
                        fontSize: "20px"
                    }}> <Link to="/portfolio/projects/indiacities" style={{
                        textDecoration: "none"
                    }}>India Cities</Link></li>
                </ui>

            </div>
        )
    }
}