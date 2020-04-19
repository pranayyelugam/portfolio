import React, { Component } from 'react';
import {
    Link
} from "react-router-dom";

export default class Header extends Component {

    render() {
        return (
            <div>
                <div className="header-select">
                    <ul className="nav-bar">
                        <Link className="nav-mem" to="/">Home</Link>
                        <Link className="nav-mem" to="/blog">Blog</Link>
                        <Link className="nav-mem" to="/books">Books</Link>
                        <Link className="nav-mem" to="/resume">Resume</Link>
                        <Link className="nav-mem" to="/interests">Interests</Link>
                    </ul>
                </div>
            </div>

        )
    }
}