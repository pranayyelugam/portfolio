import React, { Component } from 'react';
import classNames from 'classnames'
import {
    Link,
    useRouteMatch
} from "react-router-dom";
import '../css/Header.scss'

export default class Header extends Component {

    render() {
        return (
            <div className="header-row">
                <div className="empty-space"></div>
                <ul className="nav-bar">
                    <CustomLink to="/portfolio" label="Home" />
                    <CustomLink to="/portfolio/blog" label="Blog" />
                    <CustomLink to="/portfolio/books" label="Books" />
                    <CustomLink to="/portfolio/cv" label="CV" />
                    <CustomLink to="/portfolio/interests" label="Interests" />
                </ul>
            </div>

        )
    }
}

function CustomLink({ to, label }) {
    let match = useRouteMatch({
        path: to,
        exact: true
    })

    let menuItemClass = classNames('nav-mem')
    let menuActiveItemClass = classNames('active-menu-item')

    return (
        <Link className={match ? menuActiveItemClass : menuItemClass} to={to}>{label}</Link>
    )
}